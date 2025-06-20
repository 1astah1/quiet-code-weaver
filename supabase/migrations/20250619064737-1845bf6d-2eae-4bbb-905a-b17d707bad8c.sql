
-- Создаем таблицу для инвентаря пользователя с возможностью продажи
ALTER TABLE user_inventory ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE;
ALTER TABLE user_inventory ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_inventory ADD COLUMN IF NOT EXISTS sold_price INTEGER;

-- Создаем таблицу для настроек Steam
CREATE TABLE IF NOT EXISTS user_steam_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  steam_id TEXT,
  steam_nickname TEXT,
  steam_avatar_url TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем таблицу для промокодов
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  reward_coins INTEGER NOT NULL,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем таблицу для использованных промокодов
CREATE TABLE IF NOT EXISTS user_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, promo_code_id)
);

-- Создаем таблицу для FAQ
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Обновляем таблицу скинов, убираем звезды, оставляем только монеты
ALTER TABLE skins ALTER COLUMN price SET NOT NULL;

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_sold ON user_inventory(is_sold);
CREATE INDEX IF NOT EXISTS idx_user_steam_settings_user_id ON user_steam_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_user_promo_codes_user_id ON user_promo_codes(user_id);
