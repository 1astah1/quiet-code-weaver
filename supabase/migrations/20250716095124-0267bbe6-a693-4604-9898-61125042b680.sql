-- Оптимизация функции final_sell_item для лучшей производительности
CREATE OR REPLACE FUNCTION public.final_sell_item(p_inventory_id uuid, p_user_id uuid)
RETURNS TABLE(success boolean, message text, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_skin_price NUMERIC;
  v_owner_id UUID;
  v_is_sold BOOLEAN;
  v_new_balance NUMERIC;
BEGIN
  -- Блокируем строку инвентаря для предотвращения race conditions
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
  WHERE ui.id = p_inventory_id
  FOR UPDATE;

  -- Проверка 1: Предмет существует
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Предмет не найден в инвентаре'::text, NULL::NUMERIC;
    RETURN;
  END IF;
  
  -- Проверка 2: Владелец предмета
  IF v_owner_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Вы не являетесь владельцем этого предмета'::text, NULL::NUMERIC;
    RETURN;
  END IF;

  -- Проверка 3: Предмет уже продан
  IF v_is_sold = TRUE THEN
    RETURN QUERY SELECT FALSE, 'Этот предмет уже был продан'::text, NULL::NUMERIC;
    RETURN;
  END IF;

  -- Проверка 4: Валидная цена
  IF v_skin_price IS NULL OR v_skin_price <= 0 THEN
    RETURN QUERY SELECT FALSE, 'Некорректная цена предмета'::text, NULL::NUMERIC;
    RETURN;
  END IF;

  -- Транзакция: Помечаем предмет как проданный
  UPDATE public.user_inventory
  SET 
    is_sold = TRUE,
    sold_at = now(),
    sold_price = v_skin_price
  WHERE id = p_inventory_id;

  -- Транзакция: Обновляем баланс пользователя
  UPDATE public.users
  SET coins = COALESCE(coins, 0) + v_skin_price
  WHERE id = p_user_id
  RETURNING coins INTO v_new_balance;

  -- Логирование успешной продажи
  RAISE NOTICE 'Item sold successfully: user_id=%, inventory_id=%, price=%, new_balance=%', 
    p_user_id, p_inventory_id, v_skin_price, v_new_balance;

  -- Возвращаем успешный результат
  RETURN QUERY SELECT TRUE, 'Предмет успешно продан!'::text, v_new_balance;

EXCEPTION
  WHEN OTHERS THEN
    -- В случае любой ошибки откатываем транзакцию и возвращаем ошибку
    RAISE WARNING 'Error in final_sell_item: user_id=%, inventory_id=%, error=%', 
      p_user_id, p_inventory_id, SQLERRM;
    RETURN QUERY SELECT FALSE, 'Произошла ошибка при продаже предмета'::text, NULL::NUMERIC;
END;
$$;