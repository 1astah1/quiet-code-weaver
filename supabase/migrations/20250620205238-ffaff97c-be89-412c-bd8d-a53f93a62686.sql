
-- Добавляем поля для статистики в таблицу users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_cases_opened integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_spent integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS most_expensive_skin_value integer DEFAULT 0;

-- Создаем представление для рейтингов
CREATE OR REPLACE VIEW public.user_rankings AS
SELECT 
  u.id,
  u.username,
  u.total_cases_opened,
  u.total_spent,
  u.most_expensive_skin_value,
  COALESCE(inventory_stats.total_inventory_value, 0) as total_inventory_value,
  COALESCE(inventory_stats.items_count, 0) as total_items_count
FROM public.users u
LEFT JOIN (
  SELECT 
    ui.user_id,
    SUM(s.price) as total_inventory_value,
    COUNT(*) as items_count
  FROM public.user_inventory ui
  JOIN public.skins s ON ui.skin_id = s.id
  WHERE ui.is_sold = false
  GROUP BY ui.user_id
) inventory_stats ON u.id = inventory_stats.user_id
WHERE u.profile_private = false OR u.profile_private IS NULL
ORDER BY u.total_cases_opened DESC;

-- Создаем функцию для обновления статистики пользователя
CREATE OR REPLACE FUNCTION public.update_user_stats_after_case_open()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  case_price integer;
  skin_price integer;
BEGIN
  -- Получаем цену кейса
  SELECT price INTO case_price
  FROM public.cases
  WHERE id = NEW.case_id;

  -- Получаем цену скина
  SELECT price INTO skin_price
  FROM public.skins
  WHERE id = NEW.skin_id;

  -- Обновляем статистику пользователя
  UPDATE public.users
  SET 
    total_cases_opened = COALESCE(total_cases_opened, 0) + 1,
    total_spent = COALESCE(total_spent, 0) + COALESCE(case_price, 0),
    most_expensive_skin_value = GREATEST(COALESCE(most_expensive_skin_value, 0), COALESCE(skin_price, 0))
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Создаем триггер для автоматического обновления статистики
DROP TRIGGER IF EXISTS update_user_stats_trigger ON public.recent_wins;
CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT ON public.recent_wins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats_after_case_open();

-- Добавляем RLS политики для представления рейтингов
ALTER VIEW public.user_rankings SET (security_barrier = true);
