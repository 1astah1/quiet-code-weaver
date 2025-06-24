
-- Обновляем функцию safe_open_case для корректной работы с балансом и записью выигрышей
CREATE OR REPLACE FUNCTION public.safe_open_case(
  p_user_id uuid,
  p_case_id uuid,
  p_skin_id uuid DEFAULT NULL::uuid,
  p_is_free boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  case_price integer;
  current_coins integer;
  skin_data jsonb;
  inventory_id uuid;
BEGIN
  -- Получаем цену кейса
  SELECT price INTO case_price
  FROM public.cases
  WHERE id = p_case_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  -- Если кейс платный, проверяем и списываем баланс
  IF NOT p_is_free THEN
    -- Получаем текущий баланс пользователя
    SELECT coins INTO current_coins
    FROM public.users
    WHERE id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Проверяем достаточность средств
    IF current_coins < case_price THEN
      RAISE EXCEPTION 'Insufficient funds. Current: %, Required: %', current_coins, case_price;
    END IF;
    
    -- Списываем средства
    UPDATE public.users
    SET coins = coins - case_price
    WHERE id = p_user_id;
  END IF;

  -- Добавляем скин в инвентарь
  INSERT INTO public.user_inventory (id, user_id, skin_id, obtained_at, is_sold)
  VALUES (gen_random_uuid(), p_user_id, p_skin_id, now(), false)
  RETURNING id INTO inventory_id;
  
  -- Получаем данные скина
  SELECT jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'weapon_type', s.weapon_type,
    'rarity', s.rarity,
    'price', s.price,
    'image_url', s.image_url
  ) INTO skin_data
  FROM public.skins s
  WHERE s.id = p_skin_id;

  -- Записываем выигрыш в recent_wins с полными данными
  INSERT INTO public.recent_wins (
    id, 
    user_id, 
    skin_id, 
    case_id, 
    won_at, 
    reward_type, 
    reward_data
  ) VALUES (
    gen_random_uuid(), 
    p_user_id, 
    p_skin_id, 
    p_case_id, 
    now(), 
    'skin', 
    skin_data
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'skin', skin_data,
    'inventory_id', inventory_id
  );
END;
$$;

-- Обновляем функцию safe_update_coins для более надежной работы
CREATE OR REPLACE FUNCTION public.safe_update_coins(
  p_user_id uuid,
  p_coin_change integer,
  p_operation_type text DEFAULT 'update'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_coins integer;
  new_coins integer;
BEGIN
  -- Блокируем строку пользователя для предотвращения race conditions
  SELECT coins INTO current_coins
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  new_coins := current_coins + p_coin_change;
  
  -- Проверяем на отрицательный баланс
  IF new_coins < 0 THEN
    RAISE EXCEPTION 'Insufficient funds. Current: %, Required: %', current_coins, ABS(p_coin_change);
  END IF;
  
  -- Обновляем баланс
  UPDATE public.users
  SET coins = new_coins
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$;

-- Создаем функцию для безопасной продажи скинов
CREATE OR REPLACE FUNCTION public.safe_sell_skin(
  p_user_id uuid,
  p_inventory_id uuid,
  p_sell_price integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_coins integer;
BEGIN
  -- Проверяем, что предмет существует и принадлежит пользователю
  IF NOT EXISTS (
    SELECT 1 FROM public.user_inventory 
    WHERE id = p_inventory_id 
    AND user_id = p_user_id 
    AND is_sold = false
  ) THEN
    RAISE EXCEPTION 'Item not found or already sold';
  END IF;
  
  -- Начинаем транзакцию - помечаем предмет как проданный
  UPDATE public.user_inventory
  SET 
    is_sold = true,
    sold_at = now(),
    sold_price = p_sell_price
  WHERE id = p_inventory_id AND user_id = p_user_id;
  
  -- Добавляем монеты пользователю
  SELECT coins INTO current_coins
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;
  
  UPDATE public.users
  SET coins = coins + p_sell_price
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', current_coins + p_sell_price
  );
END;
$$;
