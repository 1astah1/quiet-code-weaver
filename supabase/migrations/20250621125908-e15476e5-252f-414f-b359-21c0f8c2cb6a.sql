
-- Добавляем RLS политики для отсутствующих таблиц
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active tasks" ON public.tasks FOR SELECT USING (is_active = true);

-- Создаем таблицу для отслеживания состояния заданий пользователей
CREATE TABLE IF NOT EXISTS public.user_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'completed', 'claimed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own task progress" 
ON public.user_task_progress 
FOR SELECT 
USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage their own task progress" 
ON public.user_task_progress 
FOR ALL 
USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Создаем таблицу для аудита действий безопасности
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  success BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем функцию для безопасного обновления монет с проверками
CREATE OR REPLACE FUNCTION public.safe_update_coins_v2(
  p_user_id UUID,
  p_coin_change INTEGER,
  p_operation_type TEXT DEFAULT 'update'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Блокируем строку пользователя для предотвращения race conditions
  SELECT coins INTO current_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  new_balance := current_balance + p_coin_change;
  
  -- Проверяем на отрицательный баланс
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient funds. Current: %, Required: %', current_balance, ABS(p_coin_change);
  END IF;
  
  -- Проверяем на подозрительно большие суммы
  IF ABS(p_coin_change) > 100000 THEN
    RAISE EXCEPTION 'Coin change amount too large: %', p_coin_change;
  END IF;
  
  UPDATE public.users
  SET coins = new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Логируем операцию
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (p_user_id, 'coin_update', jsonb_build_object(
    'operation_type', p_operation_type,
    'old_balance', current_balance,
    'new_balance', new_balance,
    'change', p_coin_change
  ));
  
  RETURN true;
END;
$$;

-- Добавляем функцию для проверки временных ограничений
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_time_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM public.security_audit_log
  WHERE user_id = p_user_id
    AND action = p_action_type
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  RETURN attempt_count < p_max_attempts;
END;
$$;
