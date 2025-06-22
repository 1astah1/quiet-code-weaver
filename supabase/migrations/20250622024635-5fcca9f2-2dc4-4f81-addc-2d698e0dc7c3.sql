
-- Создаем представление для лидерборда с топом игроков по заработанному балансу
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  u.id,
  u.username,
  u.total_cases_opened,
  u.total_spent,
  u.most_expensive_skin_value,
  COALESCE(SUM(ui.sold_price), 0) as total_earned,
  COUNT(CASE WHEN ui.is_sold = true THEN 1 END) as items_sold,
  COUNT(CASE WHEN ui.is_sold = false THEN 1 END) as items_in_inventory,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ui.sold_price), 0) DESC) as rank
FROM public.users u
LEFT JOIN public.user_inventory ui ON u.id = ui.user_id
WHERE u.username IS NOT NULL 
  AND u.username != ''
GROUP BY u.id, u.username, u.total_cases_opened, u.total_spent, u.most_expensive_skin_value
ORDER BY total_earned DESC
LIMIT 100;

-- Включаем RLS для представления (наследует от users)
ALTER VIEW public.leaderboard SET (security_invoker = true);
