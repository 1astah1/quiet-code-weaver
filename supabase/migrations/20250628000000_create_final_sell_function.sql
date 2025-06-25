-- Step 1: Clean up any and all previous attempts to ensure a clean slate.
DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.sell_item_by_skin_id;
    DROP FUNCTION IF EXISTS public.safe_sell_skin;
    DROP FUNCTION IF EXISTS public.sell_most_recent_skin;
    DROP FUNCTION IF EXISTS public.atomic_sell_item;
    DROP FUNCTION IF EXISTS public.final_sell_item;
END $$;

-- Step 2: Create the one and only function for selling items.
-- This function is simple, robust, and performs the action atomically.
CREATE OR REPLACE FUNCTION public.final_sell_item(p_inventory_id uuid, p_user_id uuid)
RETURNS TABLE(success boolean, message text, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_skin_price NUMERIC;
  v_owner_id UUID;
  v_is_sold BOOLEAN;
BEGIN
  -- Lock the specific inventory row to prevent race conditions
  -- where a user might try to sell the same item twice quickly.
  PERFORM * FROM public.user_inventory WHERE id = p_inventory_id FOR UPDATE;

  -- Check if the item exists, get its owner, price, and sold status
  SELECT
    ui.user_id,
    s.price,
    ui.is_sold
  INTO
    v_owner_id,
    v_skin_price,
    v_is_sold
  FROM public.user_inventory ui
  JOIN public.skins s ON ui.skin_id = s.id
  WHERE ui.id = p_inventory_id;

  -- Guard 1: Check for existence.
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Item not found in inventory.', NULL::NUMERIC;
    RETURN;
  END IF;
  
  -- Guard 2: Check for ownership.
  IF v_owner_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'You do not own this item.', NULL::NUMERIC;
    RETURN;
  END IF;

  -- Guard 3: Check if it's already sold.
  IF v_is_sold = TRUE THEN
    RETURN QUERY SELECT FALSE, 'This item has already been sold.', NULL::NUMERIC;
    RETURN;
  END IF;

  -- Action 1: Mark the item as sold
  UPDATE public.user_inventory
  SET is_sold = TRUE
  WHERE id = p_inventory_id;

  -- Action 2: Atomically update user's balance and get the new balance
  UPDATE public.users
  SET coins = COALESCE(coins, 0) + v_skin_price
  WHERE id = p_user_id
  RETURNING coins INTO new_balance;

  -- Return successful result
  RETURN QUERY SELECT TRUE, 'Item sold successfully!', new_balance;

EXCEPTION
  WHEN OTHERS THEN
    -- In case of any other error, log it and return a generic message
    RAISE WARNING 'Error in final_sell_item: user_id=%, inventory_id=%, error=%', p_user_id, p_inventory_id, SQLERRM;
    RETURN QUERY SELECT FALSE, 'An unexpected server error occurred.', NULL::NUMERIC;
END;
$$; 