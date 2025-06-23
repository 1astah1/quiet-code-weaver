
-- Исправляем функцию safe_update_coins_v2, убираем обновление updated_at
CREATE OR REPLACE FUNCTION public.safe_update_coins_v2(p_user_id uuid, p_coin_change integer, p_operation_type text DEFAULT 'update'::text)
RETURNS boolean
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
  
  -- Обновляем только coins, без updated_at
  UPDATE public.users
  SET coins = new_balance
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
