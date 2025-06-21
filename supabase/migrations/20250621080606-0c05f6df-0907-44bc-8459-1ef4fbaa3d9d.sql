
-- Исправленная версия с проверками на существование политик

-- 1. Включаем RLS для всех таблиц, где его нет
DO $$
BEGIN
    -- Проверяем и включаем RLS только если он не включен
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_daily_rewards' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.user_daily_rewards ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_promo_codes' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.user_promo_codes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_quiz_progress' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.user_quiz_progress ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'referral_earnings' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_steam_settings' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.user_steam_settings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'skin_withdrawal_requests' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.skin_withdrawal_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. Создаем политики только если они не существуют
DO $$
BEGIN
    -- Политики для users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.users
        FOR SELECT USING (auth.uid() = auth_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.users
        FOR UPDATE USING (auth.uid() = auth_id);
    END IF;
    
    -- Политики для user_promo_codes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_promo_codes' AND policyname = 'Users can view their own promo codes') THEN
        CREATE POLICY "Users can view their own promo codes" ON public.user_promo_codes
        FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_promo_codes' AND policyname = 'Users can insert their own promo codes') THEN
        CREATE POLICY "Users can insert their own promo codes" ON public.user_promo_codes
        FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
    
    -- Политики для user_quiz_progress
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_quiz_progress' AND policyname = 'Users can view their own quiz progress') THEN
        CREATE POLICY "Users can view their own quiz progress" ON public.user_quiz_progress
        FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_quiz_progress' AND policyname = 'Users can insert their own quiz progress') THEN
        CREATE POLICY "Users can insert their own quiz progress" ON public.user_quiz_progress
        FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_quiz_progress' AND policyname = 'Users can update their own quiz progress') THEN
        CREATE POLICY "Users can update their own quiz progress" ON public.user_quiz_progress
        FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
    
    -- Политики для referral_earnings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_earnings' AND policyname = 'Users can view their referral earnings') THEN
        CREATE POLICY "Users can view their referral earnings" ON public.referral_earnings
        FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = referrer_id OR id = referred_id));
    END IF;
    
    -- Политики для user_steam_settings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_steam_settings' AND policyname = 'Users can view their own steam settings') THEN
        CREATE POLICY "Users can view their own steam settings" ON public.user_steam_settings
        FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_steam_settings' AND policyname = 'Users can insert their own steam settings') THEN
        CREATE POLICY "Users can insert their own steam settings" ON public.user_steam_settings
        FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_steam_settings' AND policyname = 'Users can update their own steam settings') THEN
        CREATE POLICY "Users can update their own steam settings" ON public.user_steam_settings
        FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
    
    -- Политики для skin_withdrawal_requests
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skin_withdrawal_requests' AND policyname = 'Users can view their own withdrawal requests') THEN
        CREATE POLICY "Users can view their own withdrawal requests" ON public.skin_withdrawal_requests
        FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skin_withdrawal_requests' AND policyname = 'Users can insert their own withdrawal requests') THEN
        CREATE POLICY "Users can insert their own withdrawal requests" ON public.skin_withdrawal_requests
        FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skin_withdrawal_requests' AND policyname = 'Users can update their own withdrawal requests') THEN
        CREATE POLICY "Users can update their own withdrawal requests" ON public.skin_withdrawal_requests
        FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));
    END IF;
END $$;

-- 3. Добавляем валидационные ограничения с проверкой
DO $$
BEGIN
    -- Ограничения для users
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_coins_positive') THEN
        ALTER TABLE public.users ADD CONSTRAINT check_coins_positive CHECK (coins >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_quiz_lives_positive') THEN
        ALTER TABLE public.users ADD CONSTRAINT check_quiz_lives_positive CHECK (quiz_lives >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_quiz_streak_positive') THEN
        ALTER TABLE public.users ADD CONSTRAINT check_quiz_streak_positive CHECK (quiz_streak >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_total_cases_positive') THEN
        ALTER TABLE public.users ADD CONSTRAINT check_total_cases_positive CHECK (total_cases_opened >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_total_spent_positive') THEN
        ALTER TABLE public.users ADD CONSTRAINT check_total_spent_positive CHECK (total_spent >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_most_expensive_positive') THEN
        ALTER TABLE public.users ADD CONSTRAINT check_most_expensive_positive CHECK (most_expensive_skin_value >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_daily_streak_positive') THEN
        ALTER TABLE public.users ADD CONSTRAINT check_daily_streak_positive CHECK (daily_streak >= 0);
    END IF;
    
    -- Ограничения для skins
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_skin_price_positive') THEN
        ALTER TABLE public.skins ADD CONSTRAINT check_skin_price_positive CHECK (price >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_probability_valid') THEN
        ALTER TABLE public.skins ADD CONSTRAINT check_probability_valid CHECK (probability >= 0 AND probability <= 1);
    END IF;
    
    -- Ограничения для cases
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_case_price_positive') THEN
        ALTER TABLE public.cases ADD CONSTRAINT check_case_price_positive CHECK (price >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_likes_positive') THEN
        ALTER TABLE public.cases ADD CONSTRAINT check_likes_positive CHECK (likes_count >= 0);
    END IF;
    
    -- Ограничения для promo_codes
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_reward_positive') THEN
        ALTER TABLE public.promo_codes ADD CONSTRAINT check_reward_positive CHECK (reward_coins >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_max_uses_positive') THEN
        ALTER TABLE public.promo_codes ADD CONSTRAINT check_max_uses_positive CHECK (max_uses IS NULL OR max_uses >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_current_uses_positive') THEN
        ALTER TABLE public.promo_codes ADD CONSTRAINT check_current_uses_positive CHECK (current_uses >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_current_less_than_max') THEN
        ALTER TABLE public.promo_codes ADD CONSTRAINT check_current_less_than_max CHECK (max_uses IS NULL OR current_uses <= max_uses);
    END IF;
END $$;

-- 4. Создаем индексы (IF NOT EXISTS автоматически)
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_skin_id ON public.user_inventory(skin_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_is_sold ON public.user_inventory(is_sold);
CREATE INDEX IF NOT EXISTS idx_recent_wins_user_id ON public.recent_wins(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_wins_won_at ON public.recent_wins(won_at);
CREATE INDEX IF NOT EXISTS idx_case_skins_case_id ON public.case_skins(case_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);

-- 5. Создаем/обновляем функции
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

CREATE OR REPLACE FUNCTION public.safe_open_case(
  p_user_id uuid,
  p_case_id uuid,
  p_skin_id uuid,
  p_is_free boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  case_price integer;
  skin_data jsonb;
  inventory_id uuid;
BEGIN
  SELECT price INTO case_price
  FROM public.cases
  WHERE id = p_case_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case not found';
  END IF;
  
  IF NOT p_is_free THEN
    IF NOT public.safe_update_coins(p_user_id, -case_price, 'case_open') THEN
      RAISE EXCEPTION 'Failed to deduct coins';
    END IF;
  END IF;
  
  INSERT INTO public.user_inventory (id, user_id, skin_id, obtained_at, is_sold)
  VALUES (gen_random_uuid(), p_user_id, p_skin_id, now(), false)
  RETURNING id INTO inventory_id;
  
  SELECT jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'weapon_type', s.weapon_type,
    'rarity', s.rarity,
    'price', s.price,
    'image_url', s.image_url
  ) INTO skin_data
  FROM public.skins s
  WHERE s.id = p_skin_id;
  
  INSERT INTO public.recent_wins (id, user_id, skin_id, case_id, won_at)
  VALUES (gen_random_uuid(), p_user_id, p_skin_id, p_case_id, now());
  
  RETURN jsonb_build_object(
    'success', true,
    'skin', skin_data,
    'inventory_id', inventory_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_self_referral()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE referral_code = NEW.referred_by 
    AND id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Self-referral is not allowed';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Удаляем триггер если существует и создаем заново
DROP TRIGGER IF EXISTS prevent_self_referral_trigger ON public.users;
CREATE TRIGGER prevent_self_referral_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  WHEN (NEW.referred_by IS NOT NULL)
  EXECUTE FUNCTION public.prevent_self_referral();

CREATE OR REPLACE FUNCTION public.check_time_limit(
  p_user_id uuid,
  p_action_type text,
  p_interval_minutes integer DEFAULT 120
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_action_time timestamp with time zone;
BEGIN
  CASE p_action_type
    WHEN 'free_case' THEN
      SELECT last_free_case_notification INTO last_action_time
      FROM public.users WHERE id = p_user_id;
    WHEN 'life_restore' THEN
      SELECT last_life_restore INTO last_action_time
      FROM public.users WHERE id = p_user_id;
    WHEN 'ad_life_restore' THEN
      SELECT last_ad_life_restore INTO last_action_time
      FROM public.users WHERE id = p_user_id;
    ELSE
      RAISE EXCEPTION 'Unknown action type: %', p_action_type;
  END CASE;
  
  IF last_action_time IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN (now() - last_action_time) >= (p_interval_minutes || ' minutes')::interval;
END;
$$;
