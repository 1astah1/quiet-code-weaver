
-- Проверяем и исправляем таблицу users
ALTER TABLE public.users 
ALTER COLUMN username DROP NOT NULL;

-- Добавляем недостающие индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);

-- Обновляем функцию handle_new_user для более надежной работы
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Проверяем, существует ли уже пользователь с таким auth_id
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
    quiz_streak,
    is_admin
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
    0,
    false
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Игнорируем дубликаты
    RETURN NEW;
  WHEN OTHERS THEN
    -- Логируем ошибку, но не блокируем создание пользователя
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Создаем триггер если его нет
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Очищаем дубликаты пользователей
DELETE FROM public.users a USING public.users b 
WHERE a.auth_id = b.auth_id 
  AND a.created_at < b.created_at;
