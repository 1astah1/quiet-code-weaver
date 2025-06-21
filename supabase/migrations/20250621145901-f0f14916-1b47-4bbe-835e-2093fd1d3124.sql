
-- Очищаем некорректные данные из user_favorites
DELETE FROM public.user_favorites 
WHERE case_id NOT IN (SELECT id FROM public.cases);

DELETE FROM public.user_favorites 
WHERE user_id NOT IN (SELECT id FROM public.users);

-- Добавляем внешние ключи только если они не существуют
DO $$ 
BEGIN
    -- Проверяем и добавляем user_favorites_user_id_fkey
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_favorites_user_id_fkey' 
        AND table_name = 'user_favorites'
    ) THEN
        ALTER TABLE public.user_favorites 
        ADD CONSTRAINT user_favorites_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Проверяем и добавляем user_inventory_user_id_fkey
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_inventory_user_id_fkey' 
        AND table_name = 'user_inventory'
    ) THEN
        ALTER TABLE public.user_inventory 
        ADD CONSTRAINT user_inventory_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Проверяем и добавляем user_inventory_skin_id_fkey
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_inventory_skin_id_fkey' 
        AND table_name = 'user_inventory'
    ) THEN
        ALTER TABLE public.user_inventory 
        ADD CONSTRAINT user_inventory_skin_id_fkey 
        FOREIGN KEY (skin_id) REFERENCES public.skins(id) ON DELETE CASCADE;
    END IF;

    -- Проверяем и добавляем recent_wins_user_id_fkey
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'recent_wins_user_id_fkey' 
        AND table_name = 'recent_wins'
    ) THEN
        ALTER TABLE public.recent_wins 
        ADD CONSTRAINT recent_wins_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Проверяем и добавляем recent_wins_skin_id_fkey
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'recent_wins_skin_id_fkey' 
        AND table_name = 'recent_wins'
    ) THEN
        ALTER TABLE public.recent_wins 
        ADD CONSTRAINT recent_wins_skin_id_fkey 
        FOREIGN KEY (skin_id) REFERENCES public.skins(id) ON DELETE CASCADE;
    END IF;

    -- Проверяем и добавляем recent_wins_case_id_fkey
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'recent_wins_case_id_fkey' 
        AND table_name = 'recent_wins'
    ) THEN
        ALTER TABLE public.recent_wins 
        ADD CONSTRAINT recent_wins_case_id_fkey 
        FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Создаем индексы для ускорения запросов (IF NOT EXISTS автоматически проверяет существование)
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_case_id ON public.user_favorites(case_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_skin_id ON public.user_inventory(skin_id);
CREATE INDEX IF NOT EXISTS idx_recent_wins_user_id ON public.recent_wins(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_wins_skin_id ON public.recent_wins(skin_id);
CREATE INDEX IF NOT EXISTS idx_case_skins_case_id ON public.case_skins(case_id);
CREATE INDEX IF NOT EXISTS idx_case_skins_skin_id ON public.case_skins(skin_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
