
-- Создаем таблицу для ежедневных наград
CREATE TABLE daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
  reward_coins INTEGER NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL DEFAULT 'coins' CHECK (reward_type IN ('coins', 'case', 'skin')),
  reward_item_id UUID, -- ID кейса или скина если тип награды не монеты
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day_number)
);

-- Создаем таблицу для отслеживания полученных наград пользователями
CREATE TABLE user_daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reward_coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

-- Добавляем поле для отслеживания последнего дня входа пользователя
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_login DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0;

-- Включаем RLS для новых таблиц
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_rewards ENABLE ROW LEVEL SECURITY;

-- Политики для daily_rewards (все могут читать)
CREATE POLICY "Anyone can view daily rewards" 
ON daily_rewards FOR SELECT 
TO authenticated
USING (is_active = true);

-- Политики для user_daily_rewards
CREATE POLICY "Users can view their own daily rewards" 
ON user_daily_rewards FOR SELECT 
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can claim their own daily rewards" 
ON user_daily_rewards FOR INSERT 
WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Создаем базовые награды на 30 дней
INSERT INTO daily_rewards (day_number, reward_coins, reward_type) VALUES
(1, 25, 'coins'),
(2, 30, 'coins'),
(3, 35, 'coins'),
(4, 40, 'coins'),
(5, 50, 'coins'),
(6, 55, 'coins'),
(7, 75, 'coins'),
(8, 35, 'coins'),
(9, 40, 'coins'),
(10, 45, 'coins'),
(11, 50, 'coins'),
(12, 60, 'coins'),
(13, 65, 'coins'),
(14, 100, 'coins'),
(15, 45, 'coins'),
(16, 50, 'coins'),
(17, 55, 'coins'),
(18, 60, 'coins'),
(19, 70, 'coins'),
(20, 75, 'coins'),
(21, 125, 'coins'),
(22, 55, 'coins'),
(23, 60, 'coins'),
(24, 65, 'coins'),
(25, 70, 'coins'),
(26, 80, 'coins'),
(27, 85, 'coins'),
(28, 150, 'coins'),
(29, 75, 'coins'),
(30, 200, 'coins');

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_daily_rewards_day_number ON daily_rewards(day_number);
CREATE INDEX IF NOT EXISTS idx_user_daily_rewards_user_id ON user_daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_rewards_day_number ON user_daily_rewards(day_number);
CREATE INDEX IF NOT EXISTS idx_users_last_daily_login ON users(last_daily_login);
