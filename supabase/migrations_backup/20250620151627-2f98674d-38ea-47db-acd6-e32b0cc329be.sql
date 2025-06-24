
-- Удаляем все существующие таблицы в правильном порядке (учитывая зависимости)
DROP TABLE IF EXISTS public.user_promo_codes CASCADE;
DROP TABLE IF EXISTS public.user_inventory CASCADE;
DROP TABLE IF EXISTS public.user_favorites CASCADE;
DROP TABLE IF EXISTS public.user_quiz_progress CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.user_freebie_claims CASCADE;
DROP TABLE IF EXISTS public.user_goals CASCADE;
DROP TABLE IF EXISTS public.user_steam_settings CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.recent_wins CASCADE;
DROP TABLE IF EXISTS public.referral_earnings CASCADE;
DROP TABLE IF EXISTS public.case_skins CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.promo_codes CASCADE;
DROP TABLE IF EXISTS public.faq_items CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.freebies CASCADE;
DROP TABLE IF EXISTS public.skins CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.supported_languages CASCADE;

-- Удаляем функции
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

-- Удаляем типы
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Создаем базовые таблицы заново

-- Таблица пользователей
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT,
  coins INTEGER DEFAULT 1000,
  premium_until TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT false,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  quiz_streak INTEGER DEFAULT 0,
  quiz_lives INTEGER DEFAULT 3,
  last_quiz_date DATE,
  steam_connected BOOLEAN DEFAULT false,
  steam_trade_url TEXT,
  language_code TEXT DEFAULT 'ru',
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  profile_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Таблица скинов
CREATE TABLE public.skins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  weapon_type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT,
  probability DECIMAL(5,4) DEFAULT 0.01,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Таблица кейсов
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  is_free BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  case_type TEXT DEFAULT 'classic',
  rarity_color TEXT DEFAULT '#666666',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Связь кейсов и скинов
CREATE TABLE public.case_skins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  skin_id UUID REFERENCES public.skins(id) ON DELETE CASCADE,
  probability DECIMAL(5,4) DEFAULT 0.01
);

-- Инвентарь пользователей
CREATE TABLE public.user_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skin_id UUID REFERENCES public.skins(id) ON DELETE CASCADE,
  obtained_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_sold BOOLEAN DEFAULT false,
  sold_at TIMESTAMP WITH TIME ZONE,
  sold_price INTEGER
);

-- Задания
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_coins INTEGER NOT NULL,
  task_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Вопросы викторины
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  category TEXT DEFAULT 'cs2',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Прогресс викторины пользователей
CREATE TABLE public.user_quiz_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false
);

-- Недавние выигрыши
CREATE TABLE public.recent_wins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skin_id UUID REFERENCES public.skins(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  won_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Избранные кейсы
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, case_id)
);

-- Реферальные доходы
CREATE TABLE public.referral_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  coins_earned INTEGER NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Промокоды
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  reward_coins INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Использованные промокоды
CREATE TABLE public.user_promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, promo_code_id)
);

-- Steam настройки пользователей
CREATE TABLE public.user_steam_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  steam_id TEXT,
  steam_nickname TEXT,
  steam_avatar_url TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Баннеры
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  button_text TEXT NOT NULL,
  button_action TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- FAQ
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Включаем RLS для всех таблиц
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_steam_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS для публичного чтения базовых данных
CREATE POLICY "Public read access" ON public.skins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.cases FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.case_skins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.recent_wins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.promo_codes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.faq_items FOR SELECT USING (true);

-- Политики для пользователей
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = auth_id OR auth_id IS NULL);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_id OR auth_id IS NULL);

-- Политики для пользовательских данных
CREATE POLICY "Users can manage own inventory" ON public.user_inventory
  FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own favorites" ON public.user_favorites
  FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own quiz progress" ON public.user_quiz_progress
  FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own steam settings" ON public.user_steam_settings
  FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can use promo codes" ON public.user_promo_codes
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can read own promo usage" ON public.user_promo_codes
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create own wins" ON public.recent_wins
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "System can create referral earnings" ON public.referral_earnings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own referral earnings" ON public.referral_earnings
  FOR SELECT USING (
    referrer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    referred_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Функция для создания пользователя при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    auth_id,
    username,
    email,
    coins,
    created_at
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    NEW.email,
    1000,
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания пользователя
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Добавляем начальные данные

-- Скины
INSERT INTO public.skins (name, weapon_type, rarity, price, probability) VALUES 
('AK-47 Redline', 'Rifle', 'Classified', 2500, 0.05),
('AWP Dragon Lore', 'Sniper', 'Covert', 15000, 0.01),
('M4A4 Howl', 'Rifle', 'Contraband', 12000, 0.02),
('Karambit Fade', 'Knife', 'Covert', 8000, 0.03),
('Glock Water Elemental', 'Pistol', 'Restricted', 800, 0.15),
('P250 Sand Dune', 'Pistol', 'Consumer', 50, 0.40),
('USP-S Orion', 'Pistol', 'Restricted', 1200, 0.12),
('M4A1-S Hyper Beast', 'Rifle', 'Covert', 3500, 0.04),
('Butterfly Knife Fade', 'Knife', 'Covert', 9500, 0.02),
('Desert Eagle Blaze', 'Pistol', 'Restricted', 1800, 0.10);

-- Кейсы
INSERT INTO public.cases (name, description, price, is_free) VALUES 
('Starter Case', 'Бесплатный кейс для новичков', 0, true),
('Premium Case', 'Премиум кейс с редкими скинами', 1000, false),
('Legendary Case', 'Легендарный кейс с эксклюзивными предметами', 2500, false);

-- Связи кейсов и скинов
INSERT INTO public.case_skins (case_id, skin_id, probability) VALUES 
-- Starter Case
((SELECT id FROM public.cases WHERE name = 'Starter Case'), (SELECT id FROM public.skins WHERE name = 'P250 Sand Dune'), 0.70),
((SELECT id FROM public.cases WHERE name = 'Starter Case'), (SELECT id FROM public.skins WHERE name = 'Glock Water Elemental'), 0.25),
((SELECT id FROM public.cases WHERE name = 'Starter Case'), (SELECT id FROM public.skins WHERE name = 'AK-47 Redline'), 0.05),

-- Premium Case
((SELECT id FROM public.cases WHERE name = 'Premium Case'), (SELECT id FROM public.skins WHERE name = 'P250 Sand Dune'), 0.40),
((SELECT id FROM public.cases WHERE name = 'Premium Case'), (SELECT id FROM public.skins WHERE name = 'Glock Water Elemental'), 0.30),
((SELECT id FROM public.cases WHERE name = 'Premium Case'), (SELECT id FROM public.skins WHERE name = 'AK-47 Redline'), 0.20),
((SELECT id FROM public.cases WHERE name = 'Premium Case'), (SELECT id FROM public.skins WHERE name = 'Karambit Fade'), 0.10),

-- Legendary Case
((SELECT id FROM public.cases WHERE name = 'Legendary Case'), (SELECT id FROM public.skins WHERE name = 'AK-47 Redline'), 0.40),
((SELECT id FROM public.cases WHERE name = 'Legendary Case'), (SELECT id FROM public.skins WHERE name = 'Karambit Fade'), 0.30),
((SELECT id FROM public.cases WHERE name = 'Legendary Case'), (SELECT id FROM public.skins WHERE name = 'M4A4 Howl'), 0.20),
((SELECT id FROM public.cases WHERE name = 'Legendary Case'), (SELECT id FROM public.skins WHERE name = 'AWP Dragon Lore'), 0.10);

-- Задания
INSERT INTO public.tasks (title, description, reward_coins, task_url) VALUES 
('Подпишись на Instagram', 'Подпишись на наш Instagram аккаунт', 100, 'https://instagram.com/fastmarket'),
('Поделись в TikTok', 'Создай видео о приложении в TikTok', 200, 'https://tiktok.com'),
('Посмотри рекламу', 'Посмотри рекламное видео', 50, '#ad'),
('Ежедневный вход', 'Заходи в приложение каждый день', 25, '#daily');

-- Вопросы викторины
INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer) VALUES 
('Какой пистолет является стартовым оружием в CS2?', 'Glock-18', 'USP-S', 'P2000', 'P250', 'A'),
('Сколько игроков в команде в CS2?', '4', '5', '6', '7', 'B'),
('Какая карта самая популярная в CS2?', 'Dust2', 'Mirage', 'Inferno', 'Cache', 'A'),
('Что означает "eco" раунд?', 'Экономия денег', 'Покупка всего', 'Форс-бай', 'Антиэко', 'A');

-- Баннеры
INSERT INTO public.banners (title, description, button_text, button_action, order_index) VALUES
('FastMarket CASE CS2', 'Открывай кейсы, получай скины!', 'Открыть кейсы 🎁', 'cases', 1),
('Магазин скинов', 'Купи понравившийся скин прямо сейчас!', 'Перейти в магазин', 'shop', 2),
('Выполняй задания', 'Получай монеты за простые действия', 'Смотреть задания', 'tasks', 3);

-- FAQ
INSERT INTO public.faq_items (question, answer, order_index) VALUES
('Как получить монеты?', 'Монеты можно получить выполняя задания, участвуя в викторине или используя промокоды.', 1),
('Как открыть кейс?', 'Выберите кейс в разделе "Скины" и нажмите кнопку "Открыть". У вас должно быть достаточно монет.', 2),
('Что такое премиум?', 'Премиум аккаунт дает дополнительные бонусы и возможности в игре.', 3);

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_sold ON public.user_inventory(is_sold);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_case_skins_case_id ON public.case_skins(case_id);
CREATE INDEX IF NOT EXISTS idx_recent_wins_won_at ON public.recent_wins(won_at);
