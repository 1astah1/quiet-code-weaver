CREATE OR REPLACE FUNCTION public.sell_most_recent_skin(
  p_user_id uuid,
  p_skin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inventory_item_record record;
  skin_record record;
  new_balance numeric;
BEGIN
  -- Find the most recent instance of the skin in the user's inventory
  SELECT * INTO inventory_item_record FROM public.user_inventory
  WHERE user_id = p_user_id AND skin_id = p_skin_id
  ORDER BY obtained_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Предмет для продажи не найден в инвентаре');
  END IF;

  -- Get the skin details to know its price
  SELECT * INTO skin_record FROM public.skins WHERE id = inventory_item_record.skin_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Скин для предмета не найден');
  END IF;

  -- Add coins to user and get new balance
  UPDATE public.users
  SET coins = coins + skin_record.price
  WHERE id = p_user_id
  RETURNING coins INTO new_balance;

  -- Remove item from inventory
  DELETE FROM public.user_inventory WHERE id = inventory_item_record.id;

  -- Return success and new balance
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', new_balance
  );
END;
$$; 