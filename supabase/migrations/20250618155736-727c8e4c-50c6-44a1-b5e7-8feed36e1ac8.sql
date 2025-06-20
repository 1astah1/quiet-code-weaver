
-- Добавляем связи между кейсами и скинами
INSERT INTO public.case_skins (case_id, skin_id, probability) VALUES 
-- Starter Case (бесплатный)
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

-- Добавляем таблицу для избранных кейсов
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, case_id)
);

-- Включаем RLS для избранного
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Политики для избранного
CREATE POLICY "Public read access" ON public.user_favorites FOR SELECT USING (true);
CREATE POLICY "Public write access" ON public.user_favorites FOR ALL USING (true);

-- Добавляем больше скинов для магазина
INSERT INTO public.skins (name, weapon_type, rarity, price, probability) VALUES 
('USP-S Orion', 'Pistol', 'Restricted', 1200, 0.12),
('M4A1-S Hyper Beast', 'Rifle', 'Covert', 3500, 0.04),
('Butterfly Knife Fade', 'Knife', 'Covert', 9500, 0.02),
('Desert Eagle Blaze', 'Pistol', 'Restricted', 1800, 0.10),
('StatTrak AK-47 Vulcan', 'Rifle', 'Classified', 4200, 0.03);

-- Обновляем пользователей с большим количеством монет для тестирования
UPDATE public.users SET coins = 10000 WHERE username = 'testuser1';
UPDATE public.users SET coins = 15000 WHERE username = 'testuser2';
