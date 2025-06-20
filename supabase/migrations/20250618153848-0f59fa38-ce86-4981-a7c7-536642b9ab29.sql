
-- Create tables for FastMarketCASECS2 app

-- Users table (will be managed by admin only)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  coins INTEGER DEFAULT 0,
  premium_until TIMESTAMP WITH TIME ZONE,
  steam_connected BOOLEAN DEFAULT false,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  quiz_streak INTEGER DEFAULT 0,
  quiz_lives INTEGER DEFAULT 3,
  last_quiz_date DATE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Skins table
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

-- Cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  is_free BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Case skins relation
CREATE TABLE public.case_skins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  skin_id UUID REFERENCES public.skins(id) ON DELETE CASCADE,
  probability DECIMAL(5,4) DEFAULT 0.01
);

-- User inventory
CREATE TABLE public.user_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skin_id UUID REFERENCES public.skins(id) ON DELETE CASCADE,
  obtained_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_coins INTEGER NOT NULL,
  task_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User quiz progress
CREATE TABLE public.user_quiz_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false
);

-- Recent wins (for live feed)
CREATE TABLE public.recent_wins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skin_id UUID REFERENCES public.skins(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  won_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Referral earnings
CREATE TABLE public.referral_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  coins_earned INTEGER NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert sample data
INSERT INTO public.users (username, email, coins, is_admin) VALUES 
('admin', 'admin@fastmarket.com', 10000, true),
('testuser1', 'user1@test.com', 500, false),
('testuser2', 'user2@test.com', 750, false);

-- Insert sample skins
INSERT INTO public.skins (name, weapon_type, rarity, price, probability) VALUES 
('AK-47 Redline', 'Rifle', 'Classified', 2500, 0.05),
('AWP Dragon Lore', 'Sniper', 'Covert', 15000, 0.01),
('M4A4 Howl', 'Rifle', 'Contraband', 12000, 0.02),
('Karambit Fade', 'Knife', 'Covert', 8000, 0.03),
('Glock Water Elemental', 'Pistol', 'Restricted', 800, 0.15),
('P250 Sand Dune', 'Pistol', 'Consumer', 50, 0.40);

-- Insert sample cases
INSERT INTO public.cases (name, description, price, is_free) VALUES 
('Starter Case', 'Бесплатный кейс для новичков', 0, true),
('Premium Case', 'Премиум кейс с редкими скинами', 1000, false),
('Legendary Case', 'Легендарный кейс с эксклюзивными предметами', 2500, false);

-- Insert sample tasks
INSERT INTO public.tasks (title, description, reward_coins, task_url) VALUES 
('Подпишись на Instagram', 'Подпишись на наш Instagram аккаунт', 100, 'https://instagram.com/fastmarket'),
('Поделись в TikTok', 'Создай видео о приложении в TikTok', 200, 'https://tiktok.com'),
('Посмотри рекламу', 'Посмотри рекламное видео', 50, '#ad'),
('Ежедневный вход', 'Заходи в приложение каждый день', 25, '#daily');

-- Insert sample quiz questions
INSERT INTO public.quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer) VALUES 
('Какой пистолет является стартовым оружием в CS2?', 'Glock-18', 'USP-S', 'P2000', 'P250', 'A'),
('Сколько игроков в команде в CS2?', '4', '5', '6', '7', 'B'),
('Какая карта самая популярная в CS2?', 'Dust2', 'Mirage', 'Inferno', 'Cache', 'A'),
('Что означает "eco" раунд?', 'Экономия денег', 'Покупка всего', 'Форс-бай', 'Антиэко', 'A');

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth for now)
CREATE POLICY "Public read access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.skins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.cases FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.case_skins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.user_inventory FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.user_quiz_progress FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.recent_wins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.referral_earnings FOR SELECT USING (true);

-- Allow public operations for demo purposes
CREATE POLICY "Public write access" ON public.users FOR ALL USING (true);
CREATE POLICY "Public write access" ON public.skins FOR ALL USING (true);
CREATE POLICY "Public write access" ON public.cases FOR ALL USING (true);
CREATE POLICY "Public write access" ON public.case_skins FOR ALL USING (true);
CREATE POLICY "Public write access" ON public.user_inventory FOR ALL USING (true);
CREATE POLICY "Public write access" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Public write access" ON public.quiz_questions FOR ALL USING (true);
CREATE POLICY "Public write access" ON public.user_quiz_progress FOR ALL USING (true);
CREATE POLICY "Public write access" ON public.recent_wins FOR ALL USING (true);
CREATE POLICY "Public write access" ON public.referral_earnings FOR ALL USING (true);
