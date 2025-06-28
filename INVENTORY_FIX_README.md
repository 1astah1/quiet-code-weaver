# Исправление ошибки загрузки инвентаря

## Проблема
В логах приложения появляется ошибка:
```
❌ [USER_INVENTORY] Error loading inventory: {code: '21000', details: null, hint: null, message: 'more than one row returned by a subquery used as an expression'}
```

## Причина
Ошибка возникает из-за проблем с политиками RLS (Row Level Security) в базе данных Supabase. Подзапрос в политике безопасности возвращает несколько строк вместо одной, что вызывает ошибку PostgreSQL.

## Решение

### 1. Применить миграцию для исправления RLS политик

Создайте и примените миграцию `20250628120000_fix_inventory_rls.sql`:

```sql
-- Fix RLS policies for user_inventory to prevent "more than one row returned by a subquery" error
-- The issue is that the subquery in the policy can return multiple rows when there are duplicate auth_id entries

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can manage own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can view their own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can update their own inventory" ON user_inventory;

-- Create new policies with proper subquery handling
CREATE POLICY "Users can read own inventory" ON user_inventory
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can manage own inventory" ON user_inventory
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Add unique constraint on auth_id to prevent duplicates
ALTER TABLE users ADD CONSTRAINT unique_auth_id UNIQUE (auth_id);

-- Clean up any duplicate auth_id entries (keep the first one)
DELETE FROM users a USING users b 
WHERE a.id > b.id AND a.auth_id = b.auth_id AND a.auth_id IS NOT NULL;
```

### 2. Как применить миграцию

#### Вариант A: Через Supabase Dashboard
1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект `vrxtrkabuasyfosmvgzp`
3. Перейдите в раздел "SQL Editor"
4. Вставьте SQL код выше и выполните

#### Вариант B: Через Supabase CLI
```bash
# Установите Supabase CLI
npm install -g supabase

# Войдите в аккаунт
supabase login

# Примените миграцию
supabase db push
```

### 3. Проверка исправления

После применения миграции:
1. Перезапустите приложение
2. Перейдите в раздел "Инвентарь"
3. Проверьте, что ошибка больше не появляется в консоли

## Альтернативное решение

Если миграция не может быть применена немедленно, код уже обновлен для лучшей обработки ошибок:

- Добавлено подробное логирование
- Улучшена обработка ошибок
- Добавлено сообщение пользователю о проблеме с конфигурацией

## Дополнительные рекомендации

1. **Проверьте дубликаты пользователей**: Убедитесь, что в таблице `users` нет записей с одинаковым `auth_id`
2. **Мониторинг**: Добавьте мониторинг для отслеживания подобных ошибок
3. **Тестирование**: Протестируйте загрузку инвентаря после применения исправлений

## Контакты

Если проблема не решается, обратитесь к команде разработки с логами ошибок. 