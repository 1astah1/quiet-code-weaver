-- Миграция для таблицы фруктов Watermelon Game
-- Позволяет админам менять картинки фруктов

CREATE TABLE IF NOT EXISTS watermelon_fruits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level INTEGER UNIQUE NOT NULL CHECK (level >= 1 AND level <= 10),
    name TEXT NOT NULL,
    radius INTEGER NOT NULL,
    color TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставляем базовые данные фруктов
INSERT INTO watermelon_fruits (level, name, radius, color) VALUES
    (1, 'Вишня', 15, '#ff6b6b'),
    (2, 'Клубника', 20, '#ff8e8e'),
    (3, 'Виноград', 30, '#8b5cf6'),
    (4, 'Мандарин', 40, '#ffa726'),
    (5, 'Апельсин', 50, '#ff9800'),
    (6, 'Яблоко', 60, '#4caf50'),
    (7, 'Груша', 70, '#8bc34a'),
    (8, 'Персик', 80, '#ffeb3b'),
    (9, 'Ананас', 90, '#ffc107'),
    (10, 'Арбуз', 100, '#e91e63')
ON CONFLICT (level) DO NOTHING;

-- Включаем RLS
ALTER TABLE watermelon_fruits ENABLE ROW LEVEL SECURITY;

-- Политики для watermelon_fruits
CREATE POLICY "Everyone can read active fruits" ON watermelon_fruits
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage fruits" ON watermelon_fruits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND user_roles @> '[{"role": "admin"}]'
        )
    );

-- Функция для получения активных фруктов
CREATE OR REPLACE FUNCTION get_watermelon_fruits()
RETURNS TABLE (
    level INTEGER,
    name TEXT,
    radius INTEGER,
    color TEXT,
    image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wf.level,
        wf.name,
        wf.radius,
        wf.color,
        wf.image_url
    FROM watermelon_fruits wf
    WHERE wf.is_active = true
    ORDER BY wf.level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления фрукта (только для админов)
CREATE OR REPLACE FUNCTION update_watermelon_fruit(
    p_level INTEGER,
    p_name TEXT DEFAULT NULL,
    p_radius INTEGER DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Проверяем права админа
    SELECT id INTO v_user_id FROM users 
    WHERE auth_id = auth.uid() 
    AND user_roles @> '[{"role": "admin"}]';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    -- Обновляем фрукт
    UPDATE watermelon_fruits 
    SET 
        name = COALESCE(p_name, name),
        radius = COALESCE(p_radius, radius),
        color = COALESCE(p_color, color),
        image_url = COALESCE(p_image_url, image_url),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = NOW()
    WHERE level = p_level;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Fruit not found');
    END IF;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 