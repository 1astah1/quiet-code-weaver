
-- Удаляем существующие политики
DROP POLICY IF EXISTS "Admins can manage all cases" ON public.cases;
DROP POLICY IF EXISTS "Everyone can view cases" ON public.cases;
DROP POLICY IF EXISTS "Admins can manage all skins" ON public.skins;
DROP POLICY IF EXISTS "Everyone can view skins" ON public.skins;
DROP POLICY IF EXISTS "Admins can manage case skins" ON public.case_skins;
DROP POLICY IF EXISTS "Everyone can view case skins" ON public.case_skins;

-- Создаем функцию для проверки админских прав
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  );
$$;

-- Новые политики для cases с правильной проверкой через auth_id
CREATE POLICY "Admins can manage all cases" ON public.cases
FOR ALL USING (public.is_admin_user());

CREATE POLICY "Everyone can view cases" ON public.cases
FOR SELECT USING (true);

-- Новые политики для skins
CREATE POLICY "Admins can manage all skins" ON public.skins
FOR ALL USING (public.is_admin_user());

CREATE POLICY "Everyone can view skins" ON public.skins
FOR SELECT USING (true);

-- Новые политики для case_skins
CREATE POLICY "Admins can manage case skins" ON public.case_skins
FOR ALL USING (public.is_admin_user());

CREATE POLICY "Everyone can view case skins" ON public.case_skins
FOR SELECT USING (true);

-- Также добавим политику для quiz_questions
CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions
FOR ALL USING (public.is_admin_user());

CREATE POLICY "Everyone can view quiz questions" ON public.quiz_questions
FOR SELECT USING (true);
