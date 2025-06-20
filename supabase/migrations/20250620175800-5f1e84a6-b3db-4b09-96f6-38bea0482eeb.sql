
-- Включаем RLS для user_favorites (если еще не включен)
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Создаем политики для user_favorites
CREATE POLICY "Users can view their own favorites" ON public.user_favorites
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own favorites" ON public.user_favorites
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own favorites" ON public.user_favorites
FOR DELETE USING (user_id = auth.uid());

-- Также создадим политики для других таблиц, которые могут иметь похожие проблемы
CREATE POLICY "Users can view their own inventory" ON public.user_inventory
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert into their own inventory" ON public.user_inventory
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own inventory" ON public.user_inventory
FOR UPDATE USING (user_id = auth.uid());

-- Политики для recent_wins (только чтение для всех)
CREATE POLICY "Everyone can view recent wins" ON public.recent_wins
FOR SELECT USING (true);

CREATE POLICY "System can insert recent wins" ON public.recent_wins
FOR INSERT WITH CHECK (true);
