
-- Включаем RLS для таблицы cases (если еще не включен)
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Создаем политику для админов - они могут делать все с кейсами
CREATE POLICY "Admins can manage all cases" ON public.cases
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Создаем политику для всех пользователей - они могут только читать кейсы
CREATE POLICY "Everyone can view cases" ON public.cases
FOR SELECT USING (true);

-- Также создадим политики для таблицы skins, если их еще нет
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all skins" ON public.skins
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

CREATE POLICY "Everyone can view skins" ON public.skins
FOR SELECT USING (true);

-- И для таблицы case_skins
ALTER TABLE public.case_skins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage case skins" ON public.case_skins
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

CREATE POLICY "Everyone can view case skins" ON public.case_skins
FOR SELECT USING (true);
