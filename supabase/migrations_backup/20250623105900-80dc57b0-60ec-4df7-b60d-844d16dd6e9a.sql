
-- Создаем таблицу для отслеживания прогресса выполнения заданий пользователями
CREATE TABLE public.user_task_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'completed', 'claimed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Добавляем индексы для быстрого поиска
CREATE INDEX idx_user_task_progress_user_id ON public.user_task_progress(user_id);
CREATE INDEX idx_user_task_progress_task_id ON public.user_task_progress(task_id);
CREATE INDEX idx_user_task_progress_status ON public.user_task_progress(status);

-- Включаем RLS
ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;

-- Политики RLS - пользователи могут видеть только свои записи
CREATE POLICY "Users can view their own task progress" 
  ON public.user_task_progress 
  FOR SELECT 
  USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own task progress" 
  ON public.user_task_progress 
  FOR INSERT 
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own task progress" 
  ON public.user_task_progress 
  FOR UPDATE 
  USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Добавляем недостающие индексы для оптимизации производительности
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id_not_sold ON public.user_inventory(user_id) WHERE is_sold = false;
CREATE INDEX IF NOT EXISTS idx_recent_wins_won_at ON public.recent_wins(won_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_skins_case_id_never_drop ON public.case_skins(case_id) WHERE never_drop = false;

-- Создаем функцию для безопасного выполнения заданий
CREATE OR REPLACE FUNCTION public.safe_complete_task(
  p_user_id uuid,
  p_task_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  task_reward integer;
  current_status text;
BEGIN
  -- Проверяем, что задание существует и активно
  SELECT reward_coins INTO task_reward
  FROM public.tasks
  WHERE id = p_task_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Task not found or inactive'
    );
  END IF;

  -- Проверяем текущий статус задания
  SELECT status INTO current_status
  FROM public.user_task_progress
  WHERE user_id = p_user_id AND task_id = p_task_id;
  
  -- Если записи нет, создаем её
  IF NOT FOUND THEN
    INSERT INTO public.user_task_progress (user_id, task_id, status, completed_at)
    VALUES (p_user_id, p_task_id, 'completed', now());
  ELSIF current_status = 'available' THEN
    -- Обновляем статус на completed
    UPDATE public.user_task_progress
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE user_id = p_user_id AND task_id = p_task_id;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Task already completed or claimed'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'reward_coins', task_reward
  );
END;
$function$;

-- Создаем функцию для получения награды за задание
CREATE OR REPLACE FUNCTION public.safe_claim_task_reward(
  p_user_id uuid,
  p_task_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  task_reward integer;
  current_status text;
  user_balance integer;
BEGIN
  -- Проверяем, что задание существует и активно
  SELECT reward_coins INTO task_reward
  FROM public.tasks
  WHERE id = p_task_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Task not found or inactive'
    );
  END IF;

  -- Проверяем статус задания
  SELECT status INTO current_status
  FROM public.user_task_progress
  WHERE user_id = p_user_id AND task_id = p_task_id;
  
  IF current_status != 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Task not completed yet'
    );
  END IF;
  
  -- Добавляем монеты пользователю
  IF NOT public.safe_update_coins(p_user_id, task_reward, 'task_reward') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to add coins'
    );
  END IF;
  
  -- Обновляем статус на claimed
  UPDATE public.user_task_progress
  SET status = 'claimed', claimed_at = now(), updated_at = now()
  WHERE user_id = p_user_id AND task_id = p_task_id;
  
  -- Получаем новый баланс
  SELECT coins INTO user_balance
  FROM public.users
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'reward_coins', task_reward,
    'new_balance', user_balance
  );
END;
$function$;

-- Добавляем функцию для проверки rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_attempts integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  attempt_count integer;
BEGIN
  -- Подсчитываем количество попыток за указанный период
  SELECT COUNT(*) INTO attempt_count
  FROM public.recent_wins
  WHERE user_id = p_user_id 
  AND won_at > now() - interval '1 minute' * p_window_minutes;
  
  RETURN attempt_count < p_max_attempts;
END;
$function$;
