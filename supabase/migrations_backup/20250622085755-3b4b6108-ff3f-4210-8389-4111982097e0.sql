
-- Создаем таблицу для отслеживания открытий бесплатных кейсов по каждому кейсу отдельно
CREATE TABLE public.user_free_case_openings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_id UUID NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, case_id)
);

-- Добавляем индекс для быстрого поиска
CREATE INDEX idx_user_free_case_openings_user_case ON public.user_free_case_openings(user_id, case_id);

-- Включаем RLS
ALTER TABLE public.user_free_case_openings ENABLE ROW LEVEL SECURITY;

-- Политики RLS - пользователи могут видеть только свои записи
CREATE POLICY "Users can view their own free case openings" 
  ON public.user_free_case_openings 
  FOR SELECT 
  USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own free case openings" 
  ON public.user_free_case_openings 
  FOR INSERT 
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own free case openings" 
  ON public.user_free_case_openings 
  FOR UPDATE 
  USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));
