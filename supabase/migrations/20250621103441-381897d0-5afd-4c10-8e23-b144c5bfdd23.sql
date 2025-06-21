
-- Создаем политику для чтения базовой информации о пользователях (никнеймы)
CREATE POLICY "Allow reading user nicknames" 
ON public.users 
FOR SELECT 
USING (true);
