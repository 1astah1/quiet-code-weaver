-- Исправляем функцию safe_open_case_with_session для синхронизации рулетки и награды
CREATE OR REPLACE FUNCTION public.safe_open_case_with_session(
  p_user_id uuid,
  p_case_id uuid,
  p_session_id text,
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
  winner_position integer;
  temp_item jsonb;
  i integer;
  last_ad_view TIMESTAMP WITH TIME ZONE;
  session_exists BOOLEAN := false;
  session_status TEXT;
  existing_session_id UUID;
  case_skin_record RECORD;
  random_skin_record RECORD;
  total_probability numeric := 0;
  random_value numeric;
  cumulative_probability numeric := 0;
BEGIN
  -- Проверяем существование сессии
  SELECT id, status INTO existing_session_id, session_status
  FROM public.case_opening_sessions
  WHERE user_id = p_user_id 
    AND case_id = p_case_id 
    AND session_id = p_session_id;
  
  IF existing_session_id IS NOT NULL THEN
    IF session_status = 'completed' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Case already opened in this session'
      );
    END IF;
    
    IF session_status = 'processing' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Case opening already in progress'
      );
    END IF;
  ELSE
    INSERT INTO public.case_opening_sessions (user_id, case_id, session_id, status)
    VALUES (p_user_id, p_case_id, p_session_id, 'pending');
  END IF;

  UPDATE public.case_opening_sessions 
  SET status = 'processing'
  WHERE user_id = p_user_id AND case_id = p_case_id AND session_id = p_session_id;

  -- Получаем цену кейса и баланс пользователя
  SELECT c.price, u.coins 
  INTO case_price, user_balance
  FROM public.cases c, public.users u
  WHERE c.id = p_case_id AND u.id = p_user_id;
  
  IF NOT FOUND THEN
    UPDATE public.case_opening_sessions 
    SET status = 'failed'
    WHERE user_id = p_user_id AND case_id = p_case_id AND session_id = p_session_id;
    
    RAISE EXCEPTION 'Case or user not found';
  END IF;

  -- Для бесплатных кейсов проверяем просмотр рекламы
  IF p_is_free THEN
    IF NOT p_ad_watched THEN
      UPDATE public.case_opening_sessions 
      SET status = 'failed'
      WHERE user_id = p_user_id AND case_id = p_case_id AND session_id = p_session_id;
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Ad view required for free case'
      );
    END IF;
    
    SELECT opened_at INTO last_ad_view
    FROM public.user_free_case_openings
    WHERE user_id = p_user_id AND case_id = p_case_id
    ORDER BY opened_at DESC
    LIMIT 1;
    
    IF last_ad_view IS NOT NULL AND last_ad_view > NOW() - INTERVAL '8 hours' THEN
      UPDATE public.case_opening_sessions 
      SET status = 'failed'
      WHERE user_id = p_user_id AND case_id = p_case_id AND session_id = p_session_id;
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Case cooldown active',
        'next_available', last_ad_view + INTERVAL '8 hours'
      );
    END IF;
  ELSE
    IF user_balance < case_price THEN
      UPDATE public.case_opening_sessions 
      SET status = 'failed'
      WHERE user_id = p_user_id AND case_id = p_case_id AND session_id = p_session_id;
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient funds',
        'required', case_price,
        'current', user_balance
      );
    END IF;
  END IF;

  -- НОВАЯ ЛОГИКА: Сначала генерируем рулетку из 10 предметов на основе вероятностей
  FOR i IN 0..9 LOOP
    -- Для каждой позиции рулетки выбираем случайный предмет с учетом вероятностей
    SELECT COALESCE(SUM(probability), 0) INTO total_probability
    FROM public.case_skins cs
    WHERE cs.case_id = p_case_id AND cs.never_drop = false;
    
    random_value := random() * total_probability;
    cumulative_probability := 0;
    
    -- Выбираем предмет для текущей позиции рулетки
    FOR case_skin_record IN 
      SELECT cs.skin_id, cs.coin_reward_id, cs.probability, cs.reward_type
      FROM public.case_skins cs
      WHERE cs.case_id = p_case_id AND cs.never_drop = false
      ORDER BY cs.id
    LOOP
      cumulative_probability := cumulative_probability + COALESCE(case_skin_record.probability, 0.01);
      
      IF random_value <= cumulative_probability THEN
        -- Создаем JSON объект для этого предмета
        IF case_skin_record.reward_type = 'coin_reward' THEN
          SELECT jsonb_build_object(
            'id', cr.id,
            'name', cr.name,
            'amount', cr.amount,
            'image_url', cr.image_url,
            'type', 'coin_reward',
            'price', cr.amount
          ) INTO temp_item
          FROM public.coin_rewards cr
          WHERE cr.id = case_skin_record.coin_reward_id;
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
          WHERE s.id = case_skin_record.skin_id;
        END IF;
        EXIT;
      END IF;
    END LOOP;
    
    -- Если ничего не выбрано, берем первый доступный скин
    IF temp_item IS NULL THEN
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
      LIMIT 1;
    END IF;
    
    roulette_items := roulette_items || temp_item;
    temp_item := NULL; -- Очищаем для следующей итерации
  END LOOP;

  -- ВЫБИРАЕМ ФИКСИРОВАННУЮ ПОЗИЦИЮ ПОБЕДИТЕЛЯ (5) для синхронизации с анимацией
  winner_position := 5;
  
  -- НАГРАДА = ПРЕДМЕТ НА ПОЗИЦИИ ПОБЕДИТЕЛЯ
  reward_data := roulette_items->winner_position;

  -- Списываем монеты за платный кейс
  IF NOT p_is_free THEN
    SELECT coins_debited INTO session_exists
    FROM public.case_opening_sessions
    WHERE user_id = p_user_id AND case_id = p_case_id AND session_id = p_session_id;
    
    IF NOT COALESCE(session_exists, false) THEN
      IF NOT public.safe_update_coins(p_user_id, -case_price, 'case_open') THEN
        UPDATE public.case_opening_sessions 
        SET status = 'failed'
        WHERE user_id = p_user_id AND case_id = p_case_id AND session_id = p_session_id;
        
        RAISE EXCEPTION 'Failed to deduct coins';
      END IF;
      
      UPDATE public.case_opening_sessions 
      SET coins_debited = true
      WHERE user_id = p_user_id AND case_id = p_case_id AND session_id = p_session_id;
      
      user_balance := user_balance - case_price;
    END IF;
  END IF;

  -- Обрабатываем награду в зависимости от типа
  IF (reward_data->>'type') = 'coin_reward' THEN
    coin_amount := (reward_data->>'amount')::integer;
    
    IF NOT public.safe_update_coins(p_user_id, coin_amount, 'coin_reward') THEN
      RAISE EXCEPTION 'Failed to add coin reward';
    END IF;
    
    user_balance := user_balance + coin_amount;
  ELSE
    -- Добавляем скин в инвентарь
    INSERT INTO public.user_inventory (id, user_id, skin_id, obtained_at, is_sold)
    VALUES (gen_random_uuid(), p_user_id, (reward_data->>'id')::uuid, now(), false)
    RETURNING id INTO inventory_id;
  END IF;

  -- Записываем открытие бесплатного кейса
  IF p_is_free THEN
    INSERT INTO public.user_free_case_openings (user_id, case_id, opened_at)
    VALUES (p_user_id, p_case_id, NOW())
    ON CONFLICT (user_id, case_id) 
    DO UPDATE SET opened_at = NOW();
  END IF;

  -- Записываем в recent_wins
  INSERT INTO public.recent_wins (id, user_id, skin_id, case_id, won_at, reward_type, reward_data)
  VALUES (gen_random_uuid(), p_user_id, (reward_data->>'id')::uuid, p_case_id, now(), 
          reward_data->>'type', reward_data);

  -- Помечаем сессию как завершенную
  UPDATE public.case_opening_sessions 
  SET status = 'completed', completed_at = now()
  WHERE user_id = p_user_id AND case_id = p_case_id AND session_id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'reward', reward_data,
    'inventory_id', inventory_id,
    'new_balance', user_balance,
    'roulette_items', roulette_items,
    'winner_position', winner_position,
    'session_id', p_session_id
  );
END;
$function$;
