
-- Добавляем недостающие поля в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'ru',
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vibration_enabled BOOLEAN DEFAULT true;

-- Добавляем недостающие поля в таблицу recent_wins
ALTER TABLE recent_wins 
ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'skin',
ADD COLUMN IF NOT EXISTS reward_data JSONB;

-- Добавляем недостающее поле в таблицу tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS image_url TEXT;
