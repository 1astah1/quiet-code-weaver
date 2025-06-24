
-- Создаем RPC функцию для безопасной покупки скинов
CREATE OR REPLACE FUNCTION public.safe_purchase_skin(
  p_user_id uuid,
  p_skin_id uuid,
  p_skin_price integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_balance integer;
  inventory_id uuid;
BEGIN
  -- Блокируем пользователя и проверяем баланс
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
  
  -- Проверяем достаточность средств
  IF user_balance < p_skin_price THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient funds',
      'required', p_skin_price,
      'current', user_balance
    );
  END IF;
  
  -- Проверяем что скин существует
  IF NOT EXISTS (SELECT 1 FROM public.skins WHERE id = p_skin_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Skin not found'
    );
  END IF;
  
  -- Списываем монеты
  UPDATE public.users
  SET coins = coins - p_skin_price
  WHERE id = p_user_id;
  
  -- Добавляем скин в инвентарь
  INSERT INTO public.user_inventory (id, user_id, skin_id, obtained_at, is_sold)
  VALUES (gen_random_uuid(), p_user_id, p_skin_id, now(), false)
  RETURNING id INTO inventory_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', user_balance - p_skin_price,
    'inventory_id', inventory_id
  );
END;
$function$;
