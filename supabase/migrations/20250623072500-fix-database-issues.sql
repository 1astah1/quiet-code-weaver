
-- Исправляем отсутствующие RLS политики для таблиц пользователей
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_inventory' 
    AND policyname = 'Users can manage own inventory'
  ) THEN
    CREATE POLICY "Users can manage own inventory" ON public.user_inventory
      FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_favorites' 
    AND policyname = 'Users can manage own favorites'
  ) THEN
    CREATE POLICY "Users can manage own favorites" ON public.user_favorites
      FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_quiz_progress' 
    AND policyname = 'Users can manage own quiz progress'
  ) THEN
    CREATE POLICY "Users can manage own quiz progress" ON public.user_quiz_progress
      FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_steam_settings' 
    AND policyname = 'Users can manage own steam settings'
  ) THEN
    CREATE POLICY "Users can manage own steam settings" ON public.user_steam_settings
      FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_promo_codes' 
    AND policyname = 'Users can use promo codes'
  ) THEN
    CREATE POLICY "Users can use promo codes" ON public.user_promo_codes
      FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_promo_codes' 
    AND policyname = 'Users can read own promo usage'
  ) THEN
    CREATE POLICY "Users can read own promo usage" ON public.user_promo_codes
      FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recent_wins' 
    AND policyname = 'Users can create own wins'
  ) THEN
    CREATE POLICY "Users can create own wins" ON public.recent_wins
      FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'referral_earnings' 
    AND policyname = 'System can create referral earnings'
  ) THEN
    CREATE POLICY "System can create referral earnings" ON public.referral_earnings
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'referral_earnings' 
    AND policyname = 'Users can read own referral earnings'
  ) THEN
    CREATE POLICY "Users can read own referral earnings" ON public.referral_earnings
      FOR SELECT USING (
        referrer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
        referred_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
      );
  END IF;
END $$;

-- Добавляем отсутствующие индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_sold ON public.user_inventory(is_sold);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_case_skins_case_id ON public.case_skins(case_id);
CREATE INDEX IF NOT EXISTS idx_recent_wins_won_at ON public.recent_wins(won_at);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);

-- Создаем недостающую функцию safe_update_coins если её нет
CREATE OR REPLACE FUNCTION public.safe_update_coins(
  p_user_id uuid, 
  p_coin_change integer, 
  p_operation_type text DEFAULT 'update'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance integer;
  new_balance integer;
BEGIN
  SELECT coins INTO current_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  new_balance := current_balance + p_coin_change;
  
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient funds. Current: %, Required: %', current_balance, ABS(p_coin_change);
  END IF;
  
  UPDATE public.users
  SET coins = new_balance
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$;

-- Исправляем триггер для создания новых пользователей
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Проверяем, существует ли уже пользователь с таким auth_id
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO public.users (
    auth_id,
    username,
    email,
    coins,
    referral_code,
    language_code,
    quiz_lives,
    quiz_streak,
    is_admin
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'preferred_username',
      SPLIT_PART(NEW.email, '@', 1),
      'User' || SUBSTRING(NEW.id::text, 1, 8)
    ),
    NEW.email,
    1000,
    UPPER(SUBSTRING(MD5(NEW.id::text), 1, 8)),
    'ru',
    3,
    0,
    false
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Игнорируем дубликаты
    RETURN NEW;
  WHEN OTHERS THEN
    -- Логируем ошибку, но не блокируем создание пользователя
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пересоздаем триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Добавляем ограничения для предотвращения дубликатов (с проверкой существования)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_auth_id' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT unique_auth_id UNIQUE (auth_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_referral_code' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT unique_referral_code UNIQUE (referral_code);
  END IF;
END $$;

-- Обновляем структуру таблицы cases для корректной работы с бесплатными кейсами
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'last_free_open'
  ) THEN
    ALTER TABLE public.cases ADD COLUMN last_free_open timestamp with time zone;
  END IF;
END $$;

-- Проверяем и исправляем начальные данные
INSERT INTO public.cases (name, description, price, is_free) VALUES 
('Starter Case', 'Бесплатный кейс для новичков', 0, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.cases (name, description, price, is_free) VALUES 
('Premium Case', 'Премиум кейс с редкими скинами', 1000, false)
ON CONFLICT (name) DO NOTHING;
