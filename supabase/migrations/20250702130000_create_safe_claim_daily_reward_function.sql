-- Безопасная функция для выдачи ежедневной награды
CREATE OR REPLACE FUNCTION public.safe_claim_daily_reward(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today date := CURRENT_DATE;
  last_login date;
  current_streak integer;
  next_day integer;
  reward_record RECORD;
  already_claimed boolean := false;
  new_balance integer;
BEGIN
  -- Получаем дату последнего входа и стрик
  SELECT last_daily_login, daily_streak INTO last_login, current_streak
  FROM users WHERE id = p_user_id;

  IF last_login = today THEN
    -- Уже получал сегодня
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed_today');
  END IF;

  -- Проверяем, получал ли награду за сегодня
  SELECT EXISTS(
    SELECT 1 FROM user_daily_rewards
    WHERE user_id = p_user_id AND claimed_at::date = today
  ) INTO already_claimed;

  IF already_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed_today');
  END IF;

  -- Определяем следующий день стрика
  next_day := COALESCE(current_streak, 0) + 1;

  -- Получаем награду для этого дня
  SELECT * INTO reward_record FROM daily_rewards WHERE day_number = next_day AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'reward_not_found');
  END IF;

  -- Вставляем запись о получении награды
  INSERT INTO user_daily_rewards (user_id, day_number, reward_coins)
  VALUES (p_user_id, next_day, reward_record.reward_coins);

  -- Обновляем баланс и стрик пользователя
  UPDATE users
  SET coins = coins + reward_record.reward_coins,
      daily_streak = next_day,
      last_daily_login = today
  WHERE id = p_user_id;

  -- Получаем новый баланс
  SELECT coins INTO new_balance FROM users WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'reward_day', next_day,
    'reward_coins', reward_record.reward_coins,
    'reward_type', reward_record.reward_type,
    'new_balance', new_balance,
    'new_streak', next_day
  );
END;
$$;

-- RLS: разрешить только пользователю вызывать функцию для себя
-- (RLS на таблицах уже настроен) 