-- Новая функция открытия кейса в стиле CS2
CREATE OR REPLACE FUNCTION public.cs2_open_case(
  p_user_id uuid,
  p_case_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  case_record record;
  user_record record;
  items jsonb := '[]'::jsonb;
  winner_position integer := 7;
  winner_skin_id uuid;
  winner_skin record;
  temp_skin record;
  i integer;
  new_inventory_item_id uuid;
  new_balance numeric;
BEGIN
  -- Проверяем пользователя и кейс
  SELECT * INTO user_record FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Пользователь не найден');
  END IF;
  SELECT * INTO case_record FROM cases WHERE id = p_case_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Кейс не найден');
  END IF;
  IF user_record.coins < case_record.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Недостаточно монет');
  END IF;
  -- Списываем монеты
  UPDATE users SET coins = coins - case_record.price WHERE id = p_user_id RETURNING coins INTO new_balance;
  -- Выбираем победителя случайно из скинов кейса
  SELECT skin_id INTO winner_skin_id FROM case_skins WHERE case_id = p_case_id AND never_drop = false ORDER BY random() LIMIT 1;
  SELECT * INTO winner_skin FROM skins WHERE id = winner_skin_id;
  -- Генерируем массив предметов для рулетки (10 штук, на позиции 7 — победитель)
  FOR i IN 0..9 LOOP
    IF i = winner_position THEN
      items := items || jsonb_build_object(
        'id', winner_skin.id,
        'name', winner_skin.name,
        'weapon_type', winner_skin.weapon_type,
        'rarity', winner_skin.rarity,
        'price', winner_skin.price,
        'image_url', winner_skin.image_url,
        'type', 'skin'
      );
    ELSE
      SELECT * INTO temp_skin FROM skins WHERE id IN (SELECT skin_id FROM case_skins WHERE case_id = p_case_id AND never_drop = false ORDER BY random() LIMIT 1);
      items := items || jsonb_build_object(
        'id', temp_skin.id,
        'name', temp_skin.name,
        'weapon_type', temp_skin.weapon_type,
        'rarity', temp_skin.rarity,
        'price', temp_skin.price,
        'image_url', temp_skin.image_url,
        'type', 'skin'
      );
    END IF;
  END LOOP;
  -- Добавляем скин в инвентарь
  INSERT INTO user_inventory (user_id, skin_id, obtained_at) VALUES (p_user_id, winner_skin_id, now()) RETURNING id INTO new_inventory_item_id;
  -- Возвращаем результат
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', new_balance,
    'roulette_items', items,
    'winner_position', winner_position,
    'reward', jsonb_build_object(
      'id', winner_skin.id,
      'name', winner_skin.name,
      'weapon_type', winner_skin.weapon_type,
      'rarity', winner_skin.rarity,
      'price', winner_skin.price,
      'image_url', winner_skin.image_url,
      'type', 'skin',
      'user_inventory_id', new_inventory_item_id
    )
  );
END;
$$; 