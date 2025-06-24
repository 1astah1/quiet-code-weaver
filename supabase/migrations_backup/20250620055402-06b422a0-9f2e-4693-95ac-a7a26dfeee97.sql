
-- Create banners table for carousel management
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

-- Insert some example banners
INSERT INTO public.banners (title, description, image_url, button_text, button_action, is_active, order_index) VALUES
('FastMarket CASE CS2', 'Открывай кейсы, получай скины!', NULL, 'Открыть кейсы 🎁', 'cases', true, 1),
('Магазин скинов', 'Купи понравившийся скин прямо сейчас!', NULL, 'Перейти в магазин', 'shop', true, 2),
('Выполняй задания', 'Получай монеты за простые действия', NULL, 'Смотреть задания', 'tasks', true, 3);
