CREATE OR REPLACE FUNCTION public.purchase_skin(
  p_user_id uuid,
  p_skin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  skin_record record;
  user_record record;
  new_balance numeric;
  new_inventory_item_id uuid;
BEGIN
  -- Get user and skin details
  SELECT * INTO user_record FROM public.users WHERE id = p_user_id;
  SELECT * INTO skin_record FROM public.skins WHERE id = p_skin_id;

  -- Check if user and skin exist
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Пользователь или скин не найден');
  END IF;

  -- Check if user can afford the skin
  IF user_record.coins < skin_record.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Недостаточно монет');
  END IF;

  -- Deduct coins and get new balance
  UPDATE public.users
  SET coins = coins - skin_record.price
  WHERE id = p_user_id
  RETURNING coins INTO new_balance;

  -- Add skin to user's inventory
  INSERT INTO public.user_inventory (user_id, skin_id, obtained_at)
  VALUES (p_user_id, p_skin_id, now())
  RETURNING id INTO new_inventory_item_id;

  -- Return success with new balance and inventory item ID
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', new_balance,
    'inventory_id', new_inventory_item_id
  );
END;
$$; 