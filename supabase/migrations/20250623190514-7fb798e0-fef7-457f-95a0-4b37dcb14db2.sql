
-- Создаем enum для ролей
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Создаем таблицу ролей пользователей
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Включаем RLS для таблицы ролей
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Создаем функцию для проверки ролей (без рекурсии RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Создаем функцию для проверки админских прав
CREATE OR REPLACE FUNCTION public.is_admin_user_by_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()) 
    AND role = 'admin'
  );
$$;

-- Политика: пользователи могут видеть свои роли
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Политика: только админы могут управлять ролями
CREATE POLICY "Admins can manage all roles" 
  ON public.user_roles 
  FOR ALL
  USING (public.is_admin_user_by_role());

-- Миgrируем существующих админов в новую систему ролей
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.users
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Функция для безопасного переключения админских прав
CREATE OR REPLACE FUNCTION public.toggle_admin_role(p_user_id uuid, p_grant_admin boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем что вызывающий - админ
  IF NOT public.is_admin_user_by_role() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied'
    );
  END IF;
  
  IF p_grant_admin THEN
    -- Добавляем роль админа
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Убираем роль админа
    DELETE FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin';
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;
