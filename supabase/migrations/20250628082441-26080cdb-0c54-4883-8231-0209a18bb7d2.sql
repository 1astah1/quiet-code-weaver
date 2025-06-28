
-- Создаем недостающую таблицу user_free_case_openings
CREATE TABLE IF NOT EXISTS public.user_free_case_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS для новой таблицы
ALTER TABLE public.user_free_case_openings ENABLE ROW LEVEL SECURITY;

-- Создаем политики доступа для user_free_case_openings
CREATE POLICY "Users can view their own free case openings" 
ON public.user_free_case_openings FOR SELECT 
USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own free case openings" 
ON public.user_free_case_openings FOR INSERT 
WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Создаем политики доступа для user_inventory если их нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_inventory' 
        AND policyname = 'Users can view their own inventory'
    ) THEN
        CREATE POLICY "Users can view their own inventory"
        ON public.user_inventory FOR SELECT
        USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_inventory' 
        AND policyname = 'Users can update their own inventory'
    ) THEN
        CREATE POLICY "Users can update their own inventory"
        ON public.user_inventory FOR UPDATE
        USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));
    END IF;
END
$$;

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_free_case_openings_user_id ON public.user_free_case_openings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_free_case_openings_case_id ON public.user_free_case_openings(case_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_skin_id ON public.user_inventory(skin_id);
