
-- Удаляем существующую ограничительную политику для SELECT
DROP POLICY IF EXISTS "Users can read data" ON users;

-- Создаем новую политику, которая позволяет:
-- 1. Пользователям видеть свои собственные данные
-- 2. Администраторам видеть всех пользователей
CREATE POLICY "Users can read data" ON users
  FOR SELECT USING (
    auth.uid() = auth_id OR 
    public.is_admin_user()
  );
