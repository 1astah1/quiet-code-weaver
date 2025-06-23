
-- Создаем безопасную RPC функцию для прямой продажи скинов после открытия кейса
CREATE OR REPLACE FUNCTION public.safe_sell_case_reward(
  p_user_id uuid,
  p_skin_id uuid,
  p_sell_price integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_balance integer;
  recent_win_id uuid;
  inventory_item_id uuid;
BEGIN
  -- Проверяем, что скин был недавно выигран пользователем (в течение последних 10 минут)
  SELECT id INTO recent_win_id
  FROM public.recent_wins
  WHERE user_id = p_user_id 
    AND skin_id = p_skin_id 
    AND won_at > now() - interval '10 minutes'
    AND reward_type = 'skin'
  ORDER BY won_at DESC
  LIMIT 1;
  
  IF recent_win_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Skin not found in recent wins or too old'
    );
  END IF;
  
  -- Находим соответствующий предмет в инвентаре
  SELECT id INTO inventory_item_id
  FROM public.user_inventory
  WHERE user_id = p_user_id 
    AND skin_id = p_skin_id 
    AND is_sold = false
    AND obtained_at > now() - interval '10 minutes'
  ORDER BY obtained_at DESC
  LIMIT 1;
  
  IF inventory_item_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Inventory item not found or already sold'
    );
  END IF;
  
  -- Блокируем пользователя и получаем текущий баланс
  SELECT coins INTO user_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Помечаем предмет как проданный
  UPDATE public.user_inventory
  SET 
    is_sold = true,
    sold_at = now(),
    sold_price = p_sell_price
  WHERE id = inventory_item_id;
  
  -- Добавляем монеты пользователю
  UPDATE public.users
  SET coins = coins + p_sell_price
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', user_balance + p_sell_price
  );
END;
$function$;
