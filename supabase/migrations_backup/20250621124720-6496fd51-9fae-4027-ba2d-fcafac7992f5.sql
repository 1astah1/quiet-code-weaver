
-- Добавляем отсутствующую колонку image_url в таблицу tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Создаем RLS политики для таблицы promo_codes, чтобы админы могли управлять промокодами
CREATE POLICY "Admins can manage promo codes" 
ON public.promo_codes 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Создаем RLS политики для таблицы user_promo_codes
ALTER TABLE public.user_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own promo code usage" 
ON public.user_promo_codes 
FOR SELECT 
USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create their own promo code usage" 
ON public.user_promo_codes 
FOR INSERT 
WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Обеспечиваем что все могут читать промокоды для активации
CREATE POLICY "Anyone can read active promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (is_active = true);
