
-- Удаляем проблемные внешние ключи из таблицы recent_wins, которые блокируют работу
ALTER TABLE public.recent_wins DROP CONSTRAINT IF EXISTS recent_wins_skin_id_fkey;

-- Создаем более гибкую структуру для recent_wins
-- Добавляем колонки для типа награды
ALTER TABLE public.recent_wins ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'skin';
ALTER TABLE public.recent_wins ADD COLUMN IF NOT EXISTS reward_data jsonb;

-- Делаем skin_id nullable, так как награда может быть монетами
ALTER TABLE public.recent_wins ALTER COLUMN skin_id DROP NOT NULL;
