
-- Проверим и обновим таблицу users, убедимся что все поля есть
-- Сначала добавим недостающие столбцы если их нет
DO $$
BEGIN
    -- Проверяем и добавляем столбец username если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT 'User';
    END IF;
    
    -- Проверяем и добавляем столбец email если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email TEXT;
    END IF;
    
    -- Проверяем и добавляем столбец coins если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins') THEN
        ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 1000;
    END IF;
    
    -- Проверяем и добавляем столбец is_admin если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin') THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
    
    -- Проверяем и добавляем столбец premium_until если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'premium_until') THEN
        ALTER TABLE users ADD COLUMN premium_until TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Проверяем и добавляем столбец referral_code если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') THEN
        ALTER TABLE users ADD COLUMN referral_code TEXT;
    END IF;
    
    -- Проверяем и добавляем столбец created_at если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Убедимся, что у администратора astahov10@bk.ru есть запись в таблице users
-- Сначала найдем его ID в auth.users
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Находим ID администратора из auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'astahov10@bk.ru' 
    LIMIT 1;
    
    -- Если пользователь найден в auth.users, создаем/обновляем его в публичной таблице users
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO users (id, username, email, coins, is_admin, created_at)
        VALUES (
            admin_user_id,
            'Администратор',
            'astahov10@bk.ru',
            10000,
            true,
            now()
        )
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            is_admin = true,
            coins = GREATEST(users.coins, 10000);
            
        RAISE NOTICE 'Администратор astahov10@bk.ru обновлен/создан с ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Пользователь astahov10@bk.ru не найден в auth.users';
    END IF;
END $$;

-- Включаем RLS на таблице users если он еще не включен
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Создаем базовые политики RLS для таблицы users
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- Политика для просмотра своих данных
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Политика для обновления своих данных
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Политика для создания записи пользователя
CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Функция для автоматического создания пользователя при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, email, coins, is_admin, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
        NEW.email,
        1000,
        false,
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Если пользователь уже существует, просто возвращаем NEW
        RETURN NEW;
    WHEN OTHERS THEN
        -- Логируем ошибку но не блокируем регистрацию
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Создаем триггер для автоматического создания пользователя
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
