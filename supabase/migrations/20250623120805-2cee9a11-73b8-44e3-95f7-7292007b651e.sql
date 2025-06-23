
-- Создаем таблицу для отслеживания просмотров рекламы
CREATE TABLE IF NOT EXISTS user_ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  case_opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_ad_views_user_case ON user_ad_views(user_id, case_id);
CREATE INDEX IF NOT EXISTS idx_user_ad_views_viewed_at ON user_ad_views(viewed_at);

-- Обновляем RPC функцию safe_open_case для работы с рекламой
CREATE OR REPLACE FUNCTION public.safe_open_case(
  p_user_id uuid, 
  p_case_id uuid, 
  p_skin_id uuid DEFAULT NULL::uuid, 
  p_coin_reward_id uuid DEFAULT NULL::uuid, 
  p_is_free boolean DEFAULT false,
  p_ad_watched boolean DEFAULT false
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
  winner_position integer := 5;
  temp_item jsonb;
  i integer;
  selected_skin_id uuid;
  selected_coin_reward_id uuid;
  total_probability numeric := 0;
  random_value numeric;
  cumulative_probability numeric := 0;
  case_skin_record RECORD;
  last_ad_view TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Получаем цену кейса и баланс пользователя
  SELECT c.price, u.coins 
  INTO case_price, user_balance
  FROM public.cases c, public.users u
  WHERE c.id = p_case_id AND u.id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case or user not found';
  END IF;

  -- Для бесплатных кейсов проверяем просмотр рекламы
  IF p_is_free THEN
    IF NOT p_ad_watched THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Ad view required for free case'
      );
    END IF;
    
    -- Проверяем, можно ли открыть кейс (прошло ли 8 часов с последнего открытия)
    SELECT opened_at INTO last_ad_view
    FROM public.user_free_case_openings
    WHERE user_id = p_user_id AND case_id = p_case_id
    ORDER BY opened_at DESC
    LIMIT 1;
    
    IF last_ad_view IS NOT NULL AND last_ad_view > NOW() - INTERVAL '8 hours' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Case cooldown active',
        'next_available', last_ad_view + INTERVAL '8 hours'
      );
    END IF;
    
    -- Записываем просмотр рекламы
    INSERT INTO public.user_ad_views (user_id, case_id, viewed_at, case_opened_at)
    VALUES (p_user_id, p_case_id, NOW(), NOW());
  ELSE
    -- Проверяем баланс для платных кейсов
    IF user_balance < case_price THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient funds',
        'required', case_price,
        'current', user_balance
      );
    END IF;
  END IF;

  -- Если награда не указана, выбираем случайную на основе вероятностей
  IF p_skin_id IS NULL AND p_coin_reward_id IS NULL THEN
    SELECT COALESCE(SUM(probability), 0) INTO total_probability
    FROM public.case_skins cs
    WHERE cs.case_id = p_case_id AND cs.never_drop = false;
    
    random_value := random() * total_probability;
    
    FOR case_skin_record IN 
      SELECT cs.skin_id, cs.coin_reward_id, cs.probability, cs.reward_type
      FROM public.case_skins cs
      WHERE cs.case_id = p_case_id AND cs.never_drop = false
      ORDER BY cs.id
    LOOP
      cumulative_probability := cumulative_probability + COALESCE(case_skin_record.probability, 0.01);
      
      IF random_value <= cumulative_probability THEN
        IF case_skin_record.reward_type = 'coin_reward' THEN
          selected_coin_reward_id := case_skin_record.coin_reward_id;
        ELSE
          selected_skin_id := case_skin_record.skin_id;
        END IF;
        EXIT;
      END IF;
    END LOOP;
    
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

  -- Записываем открытие бесплатного кейса с таймером 8 часов
  IF p_is_free THEN
    INSERT INTO public.user_free_case_openings (user_id, case_id, opened_at)
    VALUES (p_user_id, p_case_id, NOW())
    ON CONFLICT (user_id, case_id) 
    DO UPDATE SET opened_at = NOW();
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
