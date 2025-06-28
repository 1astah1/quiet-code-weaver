# Исправление ошибки загрузки инвентаря

## Проблема
В логах приложения появляется ошибка:
```
❌ [USER_INVENTORY] Error loading inventory: {code: '21000', details: null, hint: null, message: 'more than one row returned by a subquery used as an expression'}
```

## Причина
Ошибка возникает из-за проблем с политиками RLS (Row Level Security) в базе данных Supabase. Подзапрос в политике безопасности возвращает несколько строк вместо одной, что вызывает ошибку PostgreSQL.

## Решение (Рекомендуемый способ)

### Применить миграцию через Supabase Dashboard

1. **Откройте Supabase Dashboard**:
   - Перейдите на https://supabase.com/dashboard
   - Войдите в свой аккаунт
   - Выберите проект `vrxtrkabuasyfosmvgzp`

2. **Перейдите в SQL Editor**:
   - В левом меню найдите "SQL Editor"
   - Нажмите "New query"

3. **Сначала очистите дубликаты пользователей** (если есть ошибка с уникальным индексом):

```sql
-- Проверим дубликаты
SELECT auth_id, COUNT(*) as count
FROM users 
WHERE auth_id IS NOT NULL
GROUP BY auth_id 
HAVING COUNT(*) > 1;

-- Очистим дубликаты, оставив только первую запись для каждого auth_id
-- Используем DISTINCT ON для правильной работы с UUID
DELETE FROM users 
WHERE id NOT IN (
  SELECT DISTINCT ON (auth_id) id
  FROM users 
  WHERE auth_id IS NOT NULL
  ORDER BY auth_id, created_at ASC
);

-- Проверим, что дубликаты удалены
SELECT auth_id, COUNT(*) as count
FROM users 
WHERE auth_id IS NOT NULL
GROUP BY auth_id 
HAVING COUNT(*) > 1;
```

4. **Выполните основную миграцию**:

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

-- Also fix other tables that might have the same issue
DROP POLICY IF EXISTS "Users can read own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON user_favorites;

CREATE POLICY "Users can read own favorites" ON user_favorites
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can manage own favorites" ON user_favorites
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Users can read own quiz progress" ON user_quiz_progress;
DROP POLICY IF EXISTS "Users can manage own quiz progress" ON user_quiz_progress;

CREATE POLICY "Users can read own quiz progress" ON user_quiz_progress
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can manage own quiz progress" ON user_quiz_progress
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Users can read own promo usage" ON user_promo_codes;
DROP POLICY IF EXISTS "Users can use promo codes" ON user_promo_codes;

CREATE POLICY "Users can read own promo usage" ON user_promo_codes
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can use promo codes" ON user_promo_codes
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Users can read own steam settings" ON user_steam_settings;
DROP POLICY IF EXISTS "Users can manage own steam settings" ON user_steam_settings;

CREATE POLICY "Users can read own steam settings" ON user_steam_settings
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can manage own steam settings" ON user_steam_settings
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Fix user_free_case_openings policies
DROP POLICY IF EXISTS "Users can view their own free case openings" ON user_free_case_openings;
DROP POLICY IF EXISTS "Users can insert their own free case openings" ON user_free_case_openings;

CREATE POLICY "Users can view their own free case openings" 
ON user_free_case_openings FOR SELECT 
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can insert their own free case openings" 
ON user_free_case_openings FOR INSERT 
WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1));

-- Add unique constraint on auth_id to prevent duplicates
ALTER TABLE users ADD CONSTRAINT unique_auth_id UNIQUE (auth_id);
```

5. **Нажмите "Run"** для выполнения запроса

### Проверка исправления

После применения миграции:
1. Перезапустите приложение
2. Перейдите в раздел "Инвентарь"
3. Проверьте, что ошибка больше не появляется в консоли

## Возможные ошибки и их решения

### Ошибка: "could not create unique index 'unique_auth_id'"

Если вы получаете ошибку:
```
ERROR: 23505: could not create unique index "unique_auth_id"
DETAIL: Key (auth_id)=(...) is duplicated.
```

Это означает, что в таблице `users` есть дублирующиеся записи с одинаковым `auth_id`. 

**Решение**: Сначала выполните очистку дубликатов (шаг 3 выше), а затем основную миграцию.

### Безопасная очистка дубликатов (альтернативный способ)

Если вы хотите быть более осторожными с данными:

```sql
-- Создаем временную таблицу с уникальными записями
CREATE TEMP TABLE temp_unique_users AS
SELECT DISTINCT ON (auth_id) *
FROM users
WHERE auth_id IS NOT NULL
ORDER BY auth_id, created_at ASC;

-- Проверяем, что все данные на месте
SELECT COUNT(*) FROM users WHERE auth_id IS NOT NULL;
SELECT COUNT(*) FROM temp_unique_users;

-- Если все в порядке, заменяем данные
DELETE FROM users WHERE auth_id IS NOT NULL;
INSERT INTO users SELECT * FROM temp_unique_users;

-- Добавляем уникальное ограничение
ALTER TABLE users ADD CONSTRAINT unique_auth_id UNIQUE (auth_id);
```

## Альтернативные способы

### Через Supabase CLI (если установлен)

Если у вас уже установлен Supabase CLI:
```bash
supabase db push
```

### Через Docker (для разработчиков)

```bash
# Установите Supabase CLI через Docker
docker run --rm -it supabase/cli:latest db push
```

## Что было исправлено в коде

Код уже обновлен для лучшей обработки ошибок:

- ✅ Добавлено подробное логирование
- ✅ Улучшена обработка ошибок
- ✅ Добавлено информативное сообщение пользователю
- ✅ Добавлена логика повторных попыток

## Дополнительные рекомендации

1. **Проверьте дубликаты пользователей**: Убедитесь, что в таблице `users` нет записей с одинаковым `auth_id`
2. **Мониторинг**: Добавьте мониторинг для отслеживания подобных ошибок
3. **Тестирование**: Протестируйте загрузку инвентаря после применения исправлений

## Контакты

Если проблема не решается, обратитесь к команде разработки с логами ошибок. 