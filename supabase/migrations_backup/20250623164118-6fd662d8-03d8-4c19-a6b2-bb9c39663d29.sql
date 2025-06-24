
-- Обновляем функцию handle_new_user для автоматического создания реферального кода
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  referral_code_value text;
BEGIN
  -- Генерируем уникальный реферальный код на основе ID пользователя
  referral_code_value := 'FM' || UPPER(substring(NEW.id::text, 1, 8));
  
  -- Проверяем уникальность кода и при необходимости добавляем суффикс
  WHILE EXISTS (SELECT 1 FROM public.users WHERE referral_code = referral_code_value) LOOP
    referral_code_value := 'FM' || UPPER(substring(NEW.id::text, 1, 6)) || LPAD((random() * 99)::int::text, 2, '0');
  END LOOP;

  INSERT INTO public.users (
    id,
    auth_id,
    username,
    email,
    coins,
    referral_code,
    created_at
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    NEW.email,
    1000,
    referral_code_value,
    NOW()
  );
  RETURN NEW;
END;
$function$;

-- Обновляем существующих пользователей без реферального кода
UPDATE public.users 
SET referral_code = 'FM' || UPPER(substring(id::text, 1, 8))
WHERE referral_code IS NULL;

-- Включаем realtime для таблицы recent_wins
ALTER TABLE public.recent_wins REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.recent_wins;
