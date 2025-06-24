
-- Добавляем новые поля для кейсов (обложка, настройки вероятности)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS last_free_open TIMESTAMP WITH TIME ZONE;

-- Добавляем поля для настройки вероятности скинов в кейсах
ALTER TABLE case_skins ADD COLUMN IF NOT EXISTS never_drop BOOLEAN DEFAULT FALSE;
ALTER TABLE case_skins ADD COLUMN IF NOT EXISTS custom_probability NUMERIC(5,4);

-- Добавляем поле для изображений в вопросах викторины (уже есть, но проверяем)
-- ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT; -- уже существует

-- Добавляем поле для уведомлений о бесплатных кейсах
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_free_case_notification TIMESTAMP WITH TIME ZONE;

-- Добавляем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_cases_cover_image ON cases(cover_image_url);
CREATE INDEX IF NOT EXISTS idx_case_skins_probability ON case_skins(custom_probability);
CREATE INDEX IF NOT EXISTS idx_users_free_case_notification ON users(last_free_case_notification);
