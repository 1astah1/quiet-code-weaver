
-- Обновляем функцию safe_open_case для автоматического выбора наград
CREATE OR REPLACE FUNCTION public.safe_open_case(
  p_user_id uuid, 
  p_case_id uuid, 
  p_skin_id uuid DEFAULT NULL::uuid, 
  p_coin_reward_id uuid DEFAULT NULL::uuid, 
  p_is_free boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  case_price integer;
  user_balance integer;
  reward_data jsonb;
  inventory_id uuid;
  coin_amount integer;
  roulette_items jsonb := '[]'::jsonb;
  winner_position integer := 5; -- Позиция победителя в рулетке (из 10 позиций)
  temp_item jsonb;
  i integer;
  selected_skin_id uuid;
  selected_coin_reward_id uuid;
  total_probability numeric := 0;
  random_value numeric;
  cumulative_probability numeric := 0;
BEGIN
  -- Получаем цену кейса и баланс пользователя
  SELECT c.price, u.coins 
  INTO case_price, user_balance
  FROM public.cases c, public.users u
  WHERE c.id = p_case_id AND u.id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case or user not found';
  END IF;

  -- Проверяем баланс для платных кейсов
  IF NOT p_is_free AND user_balance < case_price THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient funds',
      'required', case_price,
      'current', user_balance
    );
  END IF;

  -- Если награда не указана, выбираем случайную на основе вероятностей
  IF p_skin_id IS NULL AND p_coin_reward_id IS NULL THEN
    -- Получаем общую сумму вероятностей
    SELECT COALESCE(SUM(probability), 0) INTO total_probability
    FROM public.case_skins cs
    WHERE cs.case_id = p_case_id AND cs.never_drop = false;
    
    -- Генерируем случайное число
    random_value := random() * total_probability;
    
    -- Выбираем награду на основе вероятности
    FOR temp_item IN 
      SELECT cs.skin_id, cs.coin_reward_id, cs.probability, cs.reward_type
      FROM public.case_skins cs
      WHERE cs.case_id = p_case_id AND cs.never_drop = false
      ORDER BY cs.id
    LOOP
      cumulative_probability := cumulative_probability + COALESCE(temp_item->>'probability', '0.01')::numeric;
      
      IF random_value <= cumulative_probability THEN
        IF (temp_item->>'reward_type')::text = 'coin_reward' THEN
          selected_coin_reward_id := (temp_item->>'coin_reward_id')::uuid;
        ELSE
          selected_skin_id := (temp_item->>'skin_id')::uuid;
        END IF;
        EXIT;
      END IF;
    END LOOP;
    
    -- Если ничего не выбрано, берем первый доступный скин
    IF selected_skin_id IS NULL AND selected_coin_reward_id IS NULL THEN
      SELECT cs.skin_id INTO selected_skin_id
      FROM public.case_skins cs
      WHERE cs.case_id = p_case_id AND cs.never_drop = false AND cs.skin_id IS NOT NULL
      LIMIT 1;
    END IF;
  ELSE
    selected_skin_id := p_skin_id;
    selected_coin_reward_id := p_coin_reward_id;
  END IF;

  -- Генерируем рулетку из 10 предметов
  FOR i IN 0..9 LOOP
    IF i = winner_position THEN
      -- На позиции победителя размещаем выигрышный предмет
      IF selected_coin_reward_id IS NOT NULL THEN
        SELECT jsonb_build_object(
          'id', cr.id,
          'name', cr.name,
          'amount', cr.amount,
          'image_url', cr.image_url,
          'type', 'coin_reward',
          'price', cr.amount
        ) INTO temp_item
        FROM public.coin_rewards cr
        WHERE cr.id = selected_coin_reward_id;
      ELSE
        SELECT jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'weapon_type', s.weapon_type,
          'rarity', s.rarity,
          'price', s.price,
          'image_url', s.image_url,
          'type', 'skin'
        ) INTO temp_item
        FROM public.skins s
        WHERE s.id = selected_skin_id;
      END IF;
    ELSE
      -- На остальных позициях размещаем случайные предметы из кейса
      SELECT jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'weapon_type', s.weapon_type,
        'rarity', s.rarity,
        'price', s.price,
        'image_url', s.image_url,
        'type', 'skin'
      ) INTO temp_item
      FROM public.skins s
      JOIN public.case_skins cs ON cs.skin_id = s.id
      WHERE cs.case_id = p_case_id AND cs.never_drop = false
      ORDER BY RANDOM()
      LIMIT 1;
      
      -- Если скинов нет, добавляем монетную награду
      IF temp_item IS NULL THEN
        SELECT jsonb_build_object(
          'id', cr.id,
          'name', cr.name,
          'amount', cr.amount,
          'image_url', cr.image_url,
          'type', 'coin_reward',
          'price', cr.amount
        ) INTO temp_item
        FROM public.coin_rewards cr
        ORDER BY RANDOM()
        LIMIT 1;
      END IF;
    END IF;
    
    roulette_items := roulette_items || temp_item;
  END LOOP;

  -- Списываем монеты за платный кейс
  IF NOT p_is_free THEN
    IF NOT public.safe_update_coins(p_user_id, -case_price, 'case_open') THEN
      RAISE EXCEPTION 'Failed to deduct coins';
    END IF;
    user_balance := user_balance - case_price;
  END IF;

  -- Обрабатываем награду
  IF selected_coin_reward_id IS NOT NULL THEN
    SELECT amount INTO coin_amount
    FROM public.coin_rewards
    WHERE id = selected_coin_reward_id;
    
    IF NOT public.safe_update_coins(p_user_id, coin_amount, 'coin_reward') THEN
      RAISE EXCEPTION 'Failed to add coin reward';
    END IF;
    
    user_balance := user_balance + coin_amount;
    
    SELECT jsonb_build_object(
      'id', cr.id,
      'name', cr.name,
      'amount', cr.amount,
      'image_url', cr.image_url,
      'type', 'coin_reward',
      'price', cr.amount
    ) INTO reward_data
    FROM public.coin_rewards cr
    WHERE cr.id = selected_coin_reward_id;
    
  ELSE
    INSERT INTO public.user_inventory (id, user_id, skin_id, obtained_at, is_sold)
    VALUES (gen_random_uuid(), p_user_id, selected_skin_id, now(), false)
    RETURNING id INTO inventory_id;
    
    SELECT jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'weapon_type', s.weapon_type,
      'rarity', s.rarity,
      'price', s.price,
      'image_url', s.image_url,
      'type', 'skin'
    ) INTO reward_data
    FROM public.skins s
    WHERE s.id = selected_skin_id;
  END IF;

  -- Записываем в recent_wins
  INSERT INTO public.recent_wins (id, user_id, skin_id, case_id, won_at, reward_type, reward_data)
  VALUES (gen_random_uuid(), p_user_id, COALESCE(selected_skin_id, selected_coin_reward_id), p_case_id, now(), 
          CASE WHEN selected_coin_reward_id IS NOT NULL THEN 'coin_reward' ELSE 'skin' END, reward_data);
  
  RETURN jsonb_build_object(
    'success', true,
    'reward', reward_data,
    'inventory_id', inventory_id,
    'new_balance', user_balance,
    'roulette_items', roulette_items,
    'winner_position', winner_position
  );
END;
$function$;
