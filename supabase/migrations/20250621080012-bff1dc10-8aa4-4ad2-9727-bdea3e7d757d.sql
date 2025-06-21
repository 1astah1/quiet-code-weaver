
-- Удаляем существующий view и создаем новый без SECURITY DEFINER
DROP VIEW IF EXISTS public.user_rankings;

CREATE VIEW public.user_rankings AS
SELECT 
  u.id,
  u.username,
  u.total_cases_opened,
  u.total_spent,
  u.most_expensive_skin_value,
  COALESCE(SUM(s.price), 0) as total_inventory_value,
  COUNT(ui.id) as total_items_count
FROM public.users u
LEFT JOIN public.user_inventory ui ON u.id = ui.user_id AND ui.is_sold = false
LEFT JOIN public.skins s ON ui.skin_id = s.id
WHERE u.profile_private = false OR u.profile_private IS NULL
GROUP BY u.id, u.username, u.total_cases_opened, u.total_spent, u.most_expensive_skin_value;
