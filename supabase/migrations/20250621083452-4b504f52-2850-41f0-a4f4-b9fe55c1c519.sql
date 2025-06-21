
-- Сначала создаем функцию для очистки дубликатов без уникальных ограничений
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  current_deleted INTEGER;
  duplicate_record RECORD;
BEGIN
  -- Находим и удаляем дубликаты по auth_id (оставляем самого старого или админа)
  FOR duplicate_record IN
    SELECT auth_id, array_agg(id ORDER BY is_admin DESC, created_at ASC) as user_ids
    FROM public.users 
    WHERE auth_id IS NOT NULL
    GROUP BY auth_id 
    HAVING COUNT(*) > 1
  LOOP
    -- Удаляем все кроме первого (самого старого или админа)
    DELETE FROM public.users 
    WHERE id = ANY(duplicate_record.user_ids[2:]);
    
    GET DIAGNOSTICS current_deleted = ROW_COUNT;
    deleted_count := deleted_count + current_deleted;
  END LOOP;

  -- Находим и удаляем дубликаты по email (оставляем самого старого или админа)
  FOR duplicate_record IN
    SELECT email, array_agg(id ORDER BY is_admin DESC, created_at ASC) as user_ids
    FROM public.users 
    WHERE email IS NOT NULL AND email != ''
    GROUP BY email 
    HAVING COUNT(*) > 1
  LOOP
    -- Удаляем все кроме первого
    DELETE FROM public.users 
    WHERE id = ANY(duplicate_record.user_ids[2:]);
    
    GET DIAGNOSTICS current_deleted = ROW_COUNT;
    deleted_count := deleted_count + current_deleted;
  END LOOP;

  -- Находим и удаляем дубликаты по username (оставляем самого старого или админа)
  FOR duplicate_record IN
    SELECT username, array_agg(id ORDER BY is_admin DESC, created_at ASC) as user_ids
    FROM public.users 
    WHERE username IS NOT NULL AND username != ''
    GROUP BY username 
    HAVING COUNT(*) > 1
  LOOP
    -- Удаляем все кроме первого
    DELETE FROM public.users 
    WHERE id = ANY(duplicate_record.user_ids[2:]);
    
    GET DIAGNOSTICS current_deleted = ROW_COUNT;
    deleted_count := deleted_count + current_deleted;
  END LOOP;

  RETURN deleted_count;
END;
$$;

-- Выполняем очистку существующих дубликатов
SELECT public.cleanup_duplicate_users() as deleted_duplicates;

-- Теперь добавляем уникальные ограничения после очистки дубликатов
ALTER TABLE public.users ADD CONSTRAINT unique_auth_id UNIQUE (auth_id);
ALTER TABLE public.users ADD CONSTRAINT unique_email UNIQUE (email);
ALTER TABLE public.users ADD CONSTRAINT unique_username UNIQUE (username);

-- Создаем функцию триггера для предотвращения создания дубликатов
CREATE OR REPLACE FUNCTION public.prevent_user_duplicates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Проверяем дубликаты по auth_id
  IF NEW.auth_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = NEW.auth_id AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    -- Обновляем существующую запись вместо создания новой
    UPDATE public.users 
    SET 
      username = COALESCE(NEW.username, username),
      email = COALESCE(NEW.email, email),
      coins = GREATEST(COALESCE(NEW.coins, 0), COALESCE(coins, 0))
    WHERE auth_id = NEW.auth_id;
    RETURN NULL; -- Предотвращаем вставку
  END IF;

  RETURN NEW;
END;
$$;

-- Создаем триггер для предотвращения дубликатов при вставке
CREATE OR REPLACE TRIGGER prevent_user_duplicates_trigger
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_duplicates();
