
-- Добавляем новые таблицы и обновляем существующие для полной функциональности

-- Обновляем таблицу пользователей для поддержки новых функций
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_private BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vibration_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'ru';
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_trade_url TEXT;

-- Создаем таблицу для настроек профиля
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  language_code TEXT DEFAULT 'ru',
  profile_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Создаем таблицу для отзывов и обзоров
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'ToroX', 'AppsPrize', 'Desktop', 'TapJoy', 'ayeT-Studios', 'BitLabs', 'CPX'
  platform_logo TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  description TEXT,
  reward_coins INTEGER DEFAULT 0,
  is_hot BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Создаем таблицу для наград и достижений
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  reward_coins INTEGER DEFAULT 0,
  requirement_type TEXT, -- 'login_streak', 'cases_opened', 'skins_won', etc.
  requirement_value INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Создаем таблицу для пользовательских достижений
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Создаем таблицу для целей пользователя (как в скриншоте "Твои Цели")
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skin_id UUID REFERENCES skins(id) ON DELETE CASCADE,
  target_price INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  is_achieved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Обновляем таблицу кейсов для поддержки новых типов
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_type TEXT DEFAULT 'classic'; -- 'classic', 'bronze', 'premium'
ALTER TABLE cases ADD COLUMN IF NOT EXISTS rarity_color TEXT DEFAULT '#666666';

-- Создаем таблицу для бесплатных бонусов (Freebies)
CREATE TABLE IF NOT EXISTS freebies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL, -- 'coins', 'case', 'skin'
  reward_value INTEGER,
  reward_item_id UUID, -- reference to case or skin
  cooldown_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Создаем таблицу для отслеживания использования бесплатных бонусов
CREATE TABLE IF NOT EXISTS user_freebie_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  freebie_id UUID REFERENCES freebies(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_available_at TIMESTAMP WITH TIME ZONE
);

-- Обновляем таблицу quiz_questions для поддержки изображений
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'cs2';

-- Создаем таблицу для языковых настроек
CREATE TABLE IF NOT EXISTS supported_languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  flag_emoji TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Вставляем поддерживаемые языки
INSERT INTO supported_languages (code, name, flag_emoji) VALUES
('en', 'English', '🇺🇸'),
('pl', 'Polski', '🇵🇱'),
('ru', 'Русский', '🇷🇺'),
('es', 'Español', '🇪🇸'),
('de', 'Deutsch', '🇩🇪'),
('pt', 'Português', '🇧🇷'),
('fr', 'Français', '🇫🇷')
ON CONFLICT (code) DO NOTHING;

-- Вставляем тестовые данные для платформ/обзоров
INSERT INTO reviews (platform, platform_logo, title, description, reward_coins, is_hot) VALUES
('ToroX', '💜', 'Popularity', 'Quick earning platform', 10000, true),
('Clash.gg', '⚡', 'Top up your account with at least $5', 'Deposit and earn bonus', 10000, true),
('AppsPrize', '🎁', 'Register and discover any case', 'Complete registration', 3000, true),
('Desktop', '🖥️', 'Complete desktop tasks', 'Download and try apps', 5000, false),
('TapJoy', '📱', 'Mobile app offers', 'Play games and earn', 2000, false),
('ayeT-Studios', '🎮', 'Gaming platform', 'Complete gaming tasks', 1500, false),
('BitLabs', '🔬', 'Surveys and research', 'Participate in surveys', 3000, false),
('CPX Research', '📊', 'Market research', 'Share your opinion', 2500, false)
ON CONFLICT DO NOTHING;

-- Вставляем данные для бесплатных бонусов
INSERT INTO freebies (name, description, reward_type, reward_value, cooldown_hours) VALUES
('Викторина', 'Ответь на вопросы и получи монеты', 'coins', 9, 24),
('Посмотреть рекламу', 'Просмотр рекламного ролика', 'coins', 3, 1),
('Пригласить друга', 'Пригласи друга и получи бонус', 'coins', 50, 0)
ON CONFLICT DO NOTHING;

-- Включаем RLS для новых таблиц
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE freebies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_freebie_claims ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS
CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own goals" ON user_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view freebies" ON freebies
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own freebie claims" ON user_freebie_claims
  FOR ALL USING (auth.uid() = user_id);
