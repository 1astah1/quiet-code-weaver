
-- Создаем RPC функцию для продажи всех скинов пользователя
CREATE OR REPLACE FUNCTION public.sell_all_user_skins(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_value INTEGER := 0;
  items_count INTEGER := 0;
  inventory_item RECORD;
BEGIN
  -- Получаем все непроданные скины пользователя
  FOR inventory_item IN
    SELECT ui.id, ui.skin_id, s.price
    FROM public.user_inventory ui
    JOIN public.skins s ON ui.skin_id = s.id
    WHERE ui.user_id = p_user_id 
    AND ui.is_sold = false
  LOOP
    -- Помечаем скин как проданный
    UPDATE public.user_inventory
    SET 
      is_sold = true,
      sold_at = NOW(),
      sold_price = inventory_item.price
    WHERE id = inventory_item.id;
    
    -- Добавляем к общей сумме
    total_value := total_value + inventory_item.price;
    items_count := items_count + 1;
  END LOOP;
  
  -- Если есть что продавать, обновляем баланс пользователя
  IF total_value > 0 THEN
    IF NOT public.safe_update_coins_v2(p_user_id, total_value, 'sell_all_skins') THEN
      RAISE EXCEPTION 'Failed to update user balance';
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_earned', total_value,
    'items_sold', items_count
  );
END;
$$;
