-- Миграция для Watermelon Game
-- Добавляем поля в таблицу users для жизней и таймеров

-- Добавляем поля для жизней и таймеров в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS watermelon_hearts INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS last_heart_regen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_ad_regen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Создаем таблицу для сессий игры
CREATE TABLE IF NOT EXISTS watermelon_game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    coins_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS для новой таблицы
ALTER TABLE watermelon_game_sessions ENABLE ROW LEVEL SECURITY;

-- Политики для watermelon_game_sessions
CREATE POLICY "Users can read own game sessions" ON watermelon_game_sessions
    FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert own game sessions" ON watermelon_game_sessions
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update own game sessions" ON watermelon_game_sessions
    FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Функция для получения статуса игры
CREATE OR REPLACE FUNCTION get_watermelon_game_status()
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_hearts INTEGER;
    v_coins INTEGER;
    v_last_heart_regen TIMESTAMP WITH TIME ZONE;
    v_last_ad_regen TIMESTAMP WITH TIME ZONE;
    v_next_regen TEXT;
    v_next_ad TEXT;
    v_ad_available BOOLEAN;
BEGIN
    -- Получаем ID пользователя
    SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Получаем данные пользователя
    SELECT 
        watermelon_hearts,
        coins,
        last_heart_regen,
        last_ad_regen
    INTO v_hearts, v_coins, v_last_heart_regen, v_last_ad_regen
    FROM users 
    WHERE id = v_user_id;

    -- Проверяем естественное восстановление жизни (каждые 8 часов)
    IF v_hearts < 2 AND NOW() - v_last_heart_regen >= INTERVAL '8 hours' THEN
        UPDATE users 
        SET watermelon_hearts = LEAST(2, watermelon_hearts + 1),
            last_heart_regen = NOW()
        WHERE id = v_user_id;
        
        SELECT watermelon_hearts INTO v_hearts FROM users WHERE id = v_user_id;
    END IF;

    -- Вычисляем время до следующего восстановления
    IF v_hearts < 2 THEN
        v_next_regen := EXTRACT(EPOCH FROM (v_last_heart_regen + INTERVAL '8 hours' - NOW()))::INTEGER;
        v_next_regen := CONCAT(
            LPAD((v_next_regen / 3600)::TEXT, 2, '0'), ':',
            LPAD(((v_next_regen % 3600) / 60)::TEXT, 2, '0'), ':',
            LPAD((v_next_regen % 60)::TEXT, 2, '0')
        );
    ELSE
        v_next_regen := '00:00:00';
    END IF;

    -- Проверяем доступность рекламы (каждые 3 часа)
    v_ad_available := NOW() - v_last_ad_regen >= INTERVAL '3 hours';
    
    IF v_ad_available THEN
        v_next_ad := '00:00:00';
    ELSE
        v_next_ad := EXTRACT(EPOCH FROM (v_last_ad_regen + INTERVAL '3 hours' - NOW()))::INTEGER;
        v_next_ad := CONCAT(
            LPAD((v_next_ad / 3600)::TEXT, 2, '0'), ':',
            LPAD(((v_next_ad % 3600) / 60)::TEXT, 2, '0'), ':',
            LPAD((v_next_ad % 60)::TEXT, 2, '0')
        );
    END IF;

    RETURN json_build_object(
        'hearts', v_hearts,
        'coins', v_coins,
        'next_regen', v_next_regen,
        'next_ad', v_next_ad,
        'ad_available', v_ad_available
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для начала игры
CREATE OR REPLACE FUNCTION start_watermelon_game()
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_hearts INTEGER;
    v_session_id UUID;
BEGIN
    -- Получаем ID пользователя
    SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Проверяем жизни
    SELECT watermelon_hearts INTO v_hearts FROM users WHERE id = v_user_id;
    IF v_hearts <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'No hearts available');
    END IF;

    -- Создаем сессию
    INSERT INTO watermelon_game_sessions (user_id) VALUES (v_user_id) RETURNING id INTO v_session_id;

    -- Уменьшаем жизни
    UPDATE users SET watermelon_hearts = watermelon_hearts - 1 WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'session_id', v_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для завершения игры
CREATE OR REPLACE FUNCTION end_watermelon_game(p_session_id UUID, p_coins_earned INTEGER)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_coins INTEGER;
BEGIN
    -- Получаем ID пользователя
    SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Обновляем сессию
    UPDATE watermelon_game_sessions 
    SET end_time = NOW(), coins_earned = p_coins_earned
    WHERE id = p_session_id AND user_id = v_user_id;

    -- Добавляем монеты пользователю
    UPDATE users SET coins = coins + p_coins_earned WHERE id = v_user_id;
    SELECT coins INTO v_coins FROM users WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'coins', v_coins);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для восстановления жизни за рекламу
CREATE OR REPLACE FUNCTION restore_watermelon_heart_ad()
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_hearts INTEGER;
    v_last_ad_regen TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Получаем ID пользователя
    SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Проверяем доступность рекламы
    SELECT watermelon_hearts, last_ad_regen INTO v_hearts, v_last_ad_regen 
    FROM users WHERE id = v_user_id;

    IF NOW() - v_last_ad_regen < INTERVAL '3 hours' THEN
        RETURN json_build_object('success', false, 'error', 'Ad not available yet');
    END IF;

    IF v_hearts >= 2 THEN
        RETURN json_build_object('success', false, 'error', 'Already have max hearts');
    END IF;

    -- Восстанавливаем жизнь
    UPDATE users 
    SET watermelon_hearts = watermelon_hearts + 1,
        last_ad_regen = NOW()
    WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'hearts', v_hearts + 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 