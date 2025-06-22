
-- Создаем таблицу для монетных наград
CREATE TABLE IF NOT EXISTS coin_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount INTEGER NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставляем предустановленные монетные награды
INSERT INTO coin_rewards (amount, name, image_url) VALUES
(10, '10 монет', '/lovable-uploads/coin-10.png'),
(15, '15 монет', '/lovable-uploads/coin-15.png'),
(20, '20 монет', '/lovable-uploads/coin-20.png'),
(30, '30 монет', '/lovable-uploads/coin-30.png'),
(40, '40 монет', '/lovable-uploads/coin-40.png'),
(50, '50 монет', '/lovable-uploads/coin-50.png'),
(60, '60 монет', '/lovable-uploads/coin-60.png'),
(100, '100 монет', '/lovable-uploads/coin-100.png')
ON CONFLICT DO NOTHING;

-- Добавляем поля в таблицу case_skins для поддержки монетных наград
ALTER TABLE case_skins ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'skin';
ALTER TABLE case_skins ADD COLUMN IF NOT EXISTS coin_reward_id UUID REFERENCES coin_rewards(id);

-- Обновляем функцию safe_open_case для поддержки монетных наград
CREATE OR REPLACE FUNCTION public.safe_open_case(
  p_user_id uuid, 
  p_case_id uuid, 
  p_skin_id uuid DEFAULT NULL, 
  p_coin_reward_id uuid DEFAULT NULL,
  p_is_free boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  case_price integer;
  reward_data jsonb;
  inventory_id uuid;
  coin_amount integer;
BEGIN
  SELECT price INTO case_price
  FROM public.cases
  WHERE id = p_case_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  IF NOT p_is_free THEN
    IF NOT public.safe_update_coins(p_user_id, -case_price, 'case_open') THEN
      RAISE EXCEPTION 'Failed to deduct coins';
    END IF;
  END IF;

  -- Если это монетная награда
  IF p_coin_reward_id IS NOT NULL THEN
    SELECT amount INTO coin_amount
    FROM public.coin_rewards
    WHERE id = p_coin_reward_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Coin reward not found';
    END IF;
    
    -- Добавляем монеты пользователю
    IF NOT public.safe_update_coins(p_user_id, coin_amount, 'coin_reward') THEN
      RAISE EXCEPTION 'Failed to add coin reward';
    END IF;
    
    SELECT jsonb_build_object(
      'id', cr.id,
      'name', cr.name,
      'amount', cr.amount,
      'image_url', cr.image_url,
      'type', 'coin_reward'
    ) INTO reward_data
    FROM public.coin_rewards cr
    WHERE cr.id = p_coin_reward_id;
    
  -- Если это обычный скин
  ELSE
    INSERT INTO public.user_inventory (id, user_id, skin_id, obtained_at, is_sold)
    VALUES (gen_random_uuid(), p_user_id, p_skin_id, now(), false)
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
    WHERE s.id = p_skin_id;
  END IF;

  -- Записываем в recent_wins (для статистики)
  INSERT INTO public.recent_wins (id, user_id, skin_id, case_id, won_at)
  VALUES (gen_random_uuid(), p_user_id, COALESCE(p_skin_id, p_coin_reward_id), p_case_id, now());
  
  RETURN jsonb_build_object(
    'success', true,
    'reward', reward_data,
    'inventory_id', inventory_id
  );
END;
$function$;
