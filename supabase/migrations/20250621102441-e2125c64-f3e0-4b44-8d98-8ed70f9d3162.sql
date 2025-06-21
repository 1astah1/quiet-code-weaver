
-- Удаляем старые политики для таблицы users
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;

-- Создаем новые политики
-- Политика для чтения: пользователи могут читать свои данные + админы могут читать все
CREATE POLICY "Users can read data" ON users
  FOR SELECT USING (
    auth.uid() = auth_id OR 
    public.is_admin_user()
  );

-- Политика для обновления: пользователи могут обновлять свои данные + админы могут обновлять все
CREATE POLICY "Users can update data" ON users
  FOR UPDATE USING (
    auth.uid() = auth_id OR 
    public.is_admin_user()
  );

-- Политика для создания: разрешаем создание новых пользователей
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = auth_id OR 
    public.is_admin_user()
  );

-- Политика для удаления: только админы могут удалять пользователей
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    public.is_admin_user()
  );
