CREATE OR REPLACE FUNCTION public.sell_inventory_item(
  p_user_id uuid,
  p_inventory_item_id uuid
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
  -- Find the item in the user's inventory
  SELECT * INTO inventory_item_record FROM public.user_inventory
  WHERE id = p_inventory_item_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Предмет не найден в инвентаре');
  END IF;

  -- Get the skin details
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
  DELETE FROM public.user_inventory WHERE id = p_inventory_item_id;

  -- Return success and new balance
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', new_balance
  );
END;
$$; 