
-- Удаляем все существующие таблицы и функции
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Создаем enum для ролей
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Создаем enum для статусов
CREATE TYPE public.task_status AS ENUM ('available', 'completed', 'claimed');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE public.reward_type AS ENUM ('skin', 'coins');

-- Основная таблица пользователей
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    coins INTEGER NOT NULL DEFAULT 1000 CHECK (coins >= 0),
    premium_until TIMESTAMP WITH TIME ZONE,
    language_code TEXT NOT NULL DEFAULT 'ru',
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    vibration_enabled BOOLEAN NOT NULL DEFAULT true,
    profile_private BOOLEAN NOT NULL DEFAULT false,
    steam_connected BOOLEAN NOT NULL DEFAULT false,
    steam_trade_url TEXT,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    
    -- Игровая статистика
    quiz_lives INTEGER NOT NULL DEFAULT 3 CHECK (quiz_lives >= 0 AND quiz_lives <= 10),
    quiz_streak INTEGER NOT NULL DEFAULT 0 CHECK (quiz_streak >= 0),
    last_quiz_date DATE,
    daily_streak INTEGER NOT NULL DEFAULT 0 CHECK (daily_streak >= 0),
    last_daily_login DATE,
    
    -- Статистика кейсов
    total_cases_opened INTEGER NOT NULL DEFAULT 0 CHECK (total_cases_opened >= 0),
    total_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
    most_expensive_skin_value INTEGER NOT NULL DEFAULT 0 CHECK (most_expensive_skin_value >= 0),
    
    -- Ограничения по времени
    last_life_restore TIMESTAMP WITH TIME ZONE,
    last_ad_life_restore TIMESTAMP WITH TIME ZONE,
    last_free_case_notification TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Таблица ролей пользователей
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Таблица скинов
CREATE TABLE public.skins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    weapon_type TEXT NOT NULL,
    rarity TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    image_url TEXT,
    probability DECIMAL(8,6) NOT NULL DEFAULT 0.01 CHECK (probability > 0 AND probability <= 1),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Таблица кейсов
CREATE TABLE public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL CHECK (price >= 0),
    image_url TEXT,
    cover_image_url TEXT,
    is_free BOOLEAN NOT NULL DEFAULT false,
    case_type TEXT NOT NULL DEFAULT 'classic',
    rarity_color TEXT NOT NULL DEFAULT '#666666',
    likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Таблица монетных наград
CREATE TABLE public.coin_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount INTEGER NOT NULL CHECK (amount > 0),
    name TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Связь кейсов и наград (скины + монеты)
CREATE TABLE public.case_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    reward_type reward_type NOT NULL DEFAULT 'skin',
    skin_id UUID REFERENCES public.skins(id) ON DELETE CASCADE,
    coin_reward_id UUID REFERENCES public.coin_rewards(id) ON DELETE CASCADE,
    probability DECIMAL(8,6) NOT NULL CHECK (probability > 0 AND probability <= 1),
    never_drop BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CHECK (
        (reward_type = 'skin' AND skin_id IS NOT NULL AND coin_reward_id IS NULL) OR
        (reward_type = 'coins' AND coin_reward_id IS NOT NULL AND skin_id IS NULL)
    )
);

-- Инвентарь пользователей
CREATE TABLE public.user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    skin_id UUID NOT NULL REFERENCES public.skins(id) ON DELETE CASCADE,
    obtained_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_sold BOOLEAN NOT NULL DEFAULT false,
    sold_at TIMESTAMP WITH TIME ZONE,
    sold_price INTEGER CHECK (sold_price > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Таблица заданий
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_coins INTEGER NOT NULL CHECK (reward_coins > 0),
    task_url TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Прогресс заданий пользователей
CREATE TABLE public.user_task_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    status task_status NOT NULL DEFAULT 'available',
    completed_at TIMESTAMP WITH TIME ZONE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, task_id)
);

-- Вопросы викторины
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    category TEXT NOT NULL DEFAULT 'cs2',
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Прогресс викторины пользователей
CREATE TABLE public.user_quiz_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    questions_answered INTEGER NOT NULL DEFAULT 0 CHECK (questions_answered >= 0),
    correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Промокоды
CREATE TABLE public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    reward_coins INTEGER NOT NULL CHECK (reward_coins > 0),
    max_uses INTEGER CHECK (max_uses > 0),
    current_uses INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Использование промокодов
CREATE TABLE public.user_promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, promo_code_id)
);

-- Ежедневные награды
CREATE TABLE public.daily_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_number INTEGER NOT NULL UNIQUE CHECK (day_number >= 1 AND day_number <= 30),
    reward_coins INTEGER NOT NULL CHECK (reward_coins > 0),
    reward_type TEXT NOT NULL DEFAULT 'coins',
    reward_item_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Полученные ежедневные награды
CREATE TABLE public.user_daily_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
    reward_coins INTEGER NOT NULL CHECK (reward_coins > 0),
    claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, day_number)
);

-- Открытия бесплатных кейсов
CREATE TABLE public.user_free_case_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, case_id)
);

-- Избранные кейсы
CREATE TABLE public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, case_id)
);

-- Недавние выигрыши
CREATE TABLE public.recent_wins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    reward_type reward_type NOT NULL DEFAULT 'skin',
    skin_id UUID REFERENCES public.skins(id) ON DELETE CASCADE,
    coin_reward_id UUID REFERENCES public.coin_rewards(id) ON DELETE CASCADE,
    reward_data JSONB,
    won_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CHECK (
        (reward_type = 'skin' AND skin_id IS NOT NULL AND coin_reward_id IS NULL) OR
        (reward_type = 'coins' AND coin_reward_id IS NOT NULL AND skin_id IS NULL)
    )
);

-- Реферальные доходы
CREATE TABLE public.referral_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    coins_earned INTEGER NOT NULL CHECK (coins_earned > 0),
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Запросы на вывод скинов
CREATE TABLE public.skin_withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.user_inventory(id) ON DELETE CASCADE,
    steam_trade_url TEXT NOT NULL,
    status withdrawal_status NOT NULL DEFAULT 'pending',
    steam_trade_offer_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(inventory_item_id)
);

-- Настройки Steam пользователей
CREATE TABLE public.user_steam_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    steam_id TEXT,
    steam_nickname TEXT,
    steam_avatar_url TEXT,
    connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Баннеры
CREATE TABLE public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    button_text TEXT NOT NULL,
    button_action TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- FAQ
CREATE TABLE public.faq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Аудит безопасности
CREATE TABLE public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    success BOOLEAN NOT NULL DEFAULT true,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Создаем индексы для производительности
CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_referral_code ON public.users(referral_code);
CREATE INDEX idx_users_created_at ON public.users(created_at);

CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_skin_id ON public.user_inventory(skin_id);
CREATE INDEX idx_user_inventory_is_sold ON public.user_inventory(is_sold);

CREATE INDEX idx_case_rewards_case_id ON public.case_rewards(case_id);
CREATE INDEX idx_case_rewards_skin_id ON public.case_rewards(skin_id);
CREATE INDEX idx_case_rewards_coin_reward_id ON public.case_rewards(coin_reward_id);

CREATE INDEX idx_recent_wins_user_id ON public.recent_wins(user_id);
CREATE INDEX idx_recent_wins_won_at ON public.recent_wins(won_at);

CREATE INDEX idx_user_task_progress_user_id ON public.user_task_progress(user_id);
CREATE INDEX idx_user_quiz_progress_user_id ON public.user_quiz_progress(user_id);
CREATE INDEX idx_user_promo_codes_user_id ON public.user_promo_codes(user_id);

CREATE INDEX idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_created_at ON public.security_audit_log(created_at);

-- Функция для проверки роли пользователя (предотвращает рекурсию RLS)
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = $1 AND user_roles.role = $2
    );
$$;

-- Функция для получения текущего пользователя
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT id FROM public.users WHERE auth_id = auth.uid();
$$;

-- Функция для безопасного обновления монет
CREATE OR REPLACE FUNCTION public.safe_update_coins(
    p_user_id UUID,
    p_coin_change INTEGER,
    p_operation_type TEXT DEFAULT 'update'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Блокируем строку пользователя
    SELECT coins INTO current_balance
    FROM public.users
    WHERE id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    new_balance := current_balance + p_coin_change;
    
    -- Проверяем баланс
    IF new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient funds. Current: %, Required: %', current_balance, ABS(p_coin_change);
    END IF;
    
    -- Проверяем на подозрительные суммы
    IF ABS(p_coin_change) > 1000000 THEN
        RAISE EXCEPTION 'Coin change amount too large: %', p_coin_change;
    END IF;
    
    -- Обновляем баланс
    UPDATE public.users
    SET coins = new_balance, updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Логируем операцию
    INSERT INTO public.security_audit_log (user_id, action, details)
    VALUES (p_user_id, 'coin_update', jsonb_build_object(
        'operation_type', p_operation_type,
        'old_balance', current_balance,
        'new_balance', new_balance,
        'change', p_coin_change
    ));
    
    RETURN true;
END;
$$;

-- Функция для открытия кейса
CREATE OR REPLACE FUNCTION public.safe_open_case(
    p_user_id UUID,
    p_case_id UUID,
    p_reward_type reward_type DEFAULT 'skin',
    p_skin_id UUID DEFAULT NULL,
    p_coin_reward_id UUID DEFAULT NULL,
    p_is_free BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    case_price INTEGER;
    reward_data JSONB;
    inventory_id UUID;
    coin_amount INTEGER;
BEGIN
    -- Получаем цену кейса
    SELECT price INTO case_price
    FROM public.cases
    WHERE id = p_case_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Case not found or inactive';
    END IF;

    -- Списываем монеты если не бесплатно
    IF NOT p_is_free THEN
        IF NOT public.safe_update_coins(p_user_id, -case_price, 'case_open') THEN
            RAISE EXCEPTION 'Failed to deduct coins';
        END IF;
    END IF;

    -- Обрабатываем награду
    IF p_reward_type = 'coins' AND p_coin_reward_id IS NOT NULL THEN
        -- Монетная награда
        SELECT amount INTO coin_amount
        FROM public.coin_rewards
        WHERE id = p_coin_reward_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Coin reward not found';
        END IF;
        
        -- Добавляем монеты
        IF NOT public.safe_update_coins(p_user_id, coin_amount, 'coin_reward') THEN
            RAISE EXCEPTION 'Failed to add coin reward';
        END IF;
        
        SELECT jsonb_build_object(
            'id', cr.id,
            'name', cr.name,
            'amount', cr.amount,
            'image_url', cr.image_url,
            'type', 'coin_reward'
        ) INTO reward_data
        FROM public.coin_rewards cr
        WHERE cr.id = p_coin_reward_id;
        
    ELSIF p_reward_type = 'skin' AND p_skin_id IS NOT NULL THEN
        -- Скин награда
        INSERT INTO public.user_inventory (user_id, skin_id, obtained_at)
        VALUES (p_user_id, p_skin_id, NOW())
        RETURNING id INTO inventory_id;
        
        SELECT jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'weapon_type', s.weapon_type,
            'rarity', s.rarity,
            'price', s.price,
            'image_url', s.image_url,
            'type', 'skin'
        ) INTO reward_data
        FROM public.skins s
        WHERE s.id = p_skin_id;
    ELSE
        RAISE EXCEPTION 'Invalid reward configuration';
    END IF;

    -- Записываем в недавние выигрыши
    INSERT INTO public.recent_wins (user_id, case_id, reward_type, skin_id, coin_reward_id, reward_data)
    VALUES (p_user_id, p_case_id, p_reward_type, p_skin_id, p_coin_reward_id, reward_data);
    
    -- Обновляем статистику пользователя
    UPDATE public.users
    SET 
        total_cases_opened = total_cases_opened + 1,
        total_spent = total_spent + CASE WHEN p_is_free THEN 0 ELSE case_price END,
        most_expensive_skin_value = CASE 
            WHEN p_reward_type = 'skin' THEN 
                GREATEST(most_expensive_skin_value, (SELECT price FROM public.skins WHERE id = p_skin_id))
            ELSE most_expensive_skin_value
        END,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'reward', reward_data,
        'inventory_id', inventory_id
    );
END;
$$;

-- Функция для продажи всех скинов
CREATE OR REPLACE FUNCTION public.sell_all_user_skins(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_value INTEGER := 0;
    items_count INTEGER := 0;
    inventory_item RECORD;
BEGIN
    -- Получаем все непроданные скины
    FOR inventory_item IN
        SELECT ui.id, ui.skin_id, s.price
        FROM public.user_inventory ui
        JOIN public.skins s ON ui.skin_id = s.id
        WHERE ui.user_id = p_user_id AND ui.is_sold = false
    LOOP
        -- Помечаем как проданный
        UPDATE public.user_inventory
        SET 
            is_sold = true,
            sold_at = NOW(),
            sold_price = inventory_item.price
        WHERE id = inventory_item.id;
        
        total_value := total_value + inventory_item.price;
        items_count := items_count + 1;
    END LOOP;
    
    -- Обновляем баланс если есть что продать
    IF total_value > 0 THEN
        IF NOT public.safe_update_coins(p_user_id, total_value, 'sell_all_skins') THEN
            RAISE EXCEPTION 'Failed to update balance';
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'total_earned', total_value,
        'items_sold', items_count
    );
END;
$$;

-- Функция для создания пользователя при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Проверяем, что пользователь еще не существует
    IF EXISTS (SELECT 1 FROM public.users WHERE auth_id = NEW.id) THEN
        RETURN NEW;
    END IF;
    
    INSERT INTO public.users (
        auth_id,
        username,
        email,
        coins,
        referral_code,
        language_code,
        quiz_lives,
        quiz_streak
    ) VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'preferred_username',
            SPLIT_PART(NEW.email, '@', 1),
            'User' || SUBSTRING(NEW.id::text, 1, 8)
        ),
        NEW.email,
        1000,
        UPPER(SUBSTRING(MD5(NEW.id::text), 1, 8)),
        'ru',
        3,
        0
    );
    
    -- Добавляем роль пользователя
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'user' FROM public.users WHERE auth_id = NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        RETURN NEW;
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Триггер для создания пользователя
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Включаем RLS для всех таблиц
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_free_case_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_steam_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Политики RLS для пользователей
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Allow user creation" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Политики для ролей
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

-- Политики для публичных данных (скины, кейсы и т.д.)
CREATE POLICY "Anyone can view active skins" ON public.skins
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active cases" ON public.cases
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view coin rewards" ON public.coin_rewards
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view case rewards" ON public.case_rewards
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active tasks" ON public.tasks
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active daily rewards" ON public.daily_rewards
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active banners" ON public.banners
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active FAQ" ON public.faq_items
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view recent wins" ON public.recent_wins
    FOR SELECT USING (true);

-- Политики для пользовательских данных
CREATE POLICY "Users can view their own inventory" ON public.user_inventory
    FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can manage their own task progress" ON public.user_task_progress
    FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can manage their own quiz progress" ON public.user_quiz_progress
    FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can view their own promo usage" ON public.user_promo_codes
    FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can use promo codes" ON public.user_promo_codes
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can view their own daily rewards" ON public.user_daily_rewards
    FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can claim daily rewards" ON public.user_daily_rewards
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can manage their own free case openings" ON public.user_free_case_openings
    FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
    FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can view their own referral earnings" ON public.referral_earnings
    FOR SELECT USING (
        auth.uid() = (SELECT auth_id FROM public.users WHERE id = referrer_id) OR
        auth.uid() = (SELECT auth_id FROM public.users WHERE id = referred_id)
    );

CREATE POLICY "Users can manage their own withdrawal requests" ON public.skin_withdrawal_requests
    FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can manage their own steam settings" ON public.user_steam_settings
    FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

-- Политики для админов
CREATE POLICY "Admins can manage skins" ON public.skins
    FOR ALL USING (public.has_role(public.get_current_user_id(), 'admin'));

CREATE POLICY "Admins can manage cases" ON public.cases
    FOR ALL USING (public.has_role(public.get_current_user_id(), 'admin'));

CREATE POLICY "Admins can manage case rewards" ON public.case_rewards
    FOR ALL USING (public.has_role(public.get_current_user_id(), 'admin'));

CREATE POLICY "Admins can manage tasks" ON public.tasks
    FOR ALL USING (public.has_role(public.get_current_user_id(), 'admin'));

CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions
    FOR ALL USING (public.has_role(public.get_current_user_id(), 'admin'));

CREATE POLICY "Admins can view promo codes" ON public.promo_codes
    FOR SELECT USING (public.has_role(public.get_current_user_id(), 'admin'));

CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
    FOR ALL USING (public.has_role(public.get_current_user_id(), 'admin'));

CREATE POLICY "Admins can manage banners" ON public.banners
    FOR ALL USING (public.has_role(public.get_current_user_id(), 'admin'));

CREATE POLICY "Admins can manage FAQ" ON public.faq_items
    FOR ALL USING (public.has_role(public.get_current_user_id(), 'admin'));

-- Вставляем базовые данные
INSERT INTO public.coin_rewards (amount, name, image_url) VALUES
(10, '10 монет', '/lovable-uploads/coin-10.png'),
(15, '15 монет', '/lovable-uploads/coin-15.png'),
(20, '20 монет', '/lovable-uploads/coin-20.png'),
(30, '30 монет', '/lovable-uploads/coin-30.png'),
(40, '40 монет', '/lovable-uploads/coin-40.png'),
(50, '50 монет', '/lovable-uploads/coin-50.png'),
(60, '60 монет', '/lovable-uploads/coin-60.png'),
(100, '100 монет', '/lovable-uploads/coin-100.png');

INSERT INTO public.skins (name, weapon_type, rarity, price, probability) VALUES 
('AK-47 Redline', 'Rifle', 'Classified', 2500, 0.05),
('AWP Dragon Lore', 'Sniper', 'Covert', 15000, 0.01),
('M4A4 Howl', 'Rifle', 'Contraband', 12000, 0.02),
('Karambit Fade', 'Knife', 'Covert', 8000, 0.03),
('Glock Water Elemental', 'Pistol', 'Restricted', 800, 0.15),
('P250 Sand Dune', 'Pistol', 'Consumer', 50, 0.40),
('USP-S Orion', 'Pistol', 'Restricted', 1200, 0.12),
('M4A1-S Hyper Beast', 'Rifle', 'Covert', 3500, 0.04),
('Butterfly Knife Fade', 'Knife', 'Covert', 9500, 0.02),
('Desert Eagle Blaze', 'Pistol', 'Restricted', 1800, 0.10);

INSERT INTO public.cases (name, description, price, is_free) VALUES 
('Starter Case', 'Бесплатный кейс для новичков', 0, true),
('Premium Case', 'Премиум кейс с редкими скинами', 1000, false),
('Legendary Case', 'Легендарный кейс с эксклюзивными предметами', 2500, false);

INSERT INTO public.tasks (title, description, reward_coins, task_url) VALUES 
('Подпишись на Instagram', 'Подпишись на наш Instagram аккаунт', 100, 'https://instagram.com/fastmarket'),
('Поделись в TikTok', 'Создай видео о приложении в TikTok', 200, 'https://tiktok.com'),
('Посмотри рекламу', 'Посмотри рекламное видео', 50, '#ad'),
('Ежедневный вход', 'Заходи в приложение каждый день', 25, '#daily');

INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer) VALUES 
('Какой пистолет является стартовым оружием в CS2?', 'Glock-18', 'USP-S', 'P2000', 'P250', 'A'),
('Сколько игроков в команде в CS2?', '4', '5', '6', '7', 'B'),
('Какая карта самая популярная в CS2?', 'Dust2', 'Mirage', 'Inferno', 'Cache', 'A'),
('Что означает "eco" раунд?', 'Экономия денег', 'Покупка всего', 'Форс-бай', 'Антиэко', 'A');

INSERT INTO public.banners (title, description, button_text, button_action, order_index) VALUES
('FastMarket CASE CS2', 'Открывай кейсы, получай скины!', 'Открыть кейсы 🎁', 'cases', 1),
('Магазин скинов', 'Купи понравившийся скин прямо сейчас!', 'Перейти в магазин', 'shop', 2),
('Выполняй задания', 'Получай монеты за простые действия', 'Смотреть задания', 'tasks', 3);

INSERT INTO public.daily_rewards (day_number, reward_coins) VALUES
(1, 25), (2, 30), (3, 35), (4, 40), (5, 50),
(6, 55), (7, 75), (8, 35), (9, 40), (10, 45),
(11, 50), (12, 60), (13, 65), (14, 100), (15, 45),
(16, 50), (17, 55), (18, 60), (19, 70), (20, 75),
(21, 125), (22, 55), (23, 60), (24, 65), (25, 70),
(26, 80), (27, 85), (28, 150), (29, 75), (30, 200);
