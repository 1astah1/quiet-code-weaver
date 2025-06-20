/*
  # Enable Authentication

  1. Enable authentication providers
    - Google OAuth
    - Apple OAuth  
    - Facebook OAuth
  
  2. Update users table for auth integration
    - Add auth_id column to link with Supabase auth
    - Update RLS policies for authenticated users
  
  3. Create auth triggers
    - Auto-create user profile on signup
*/

-- Add auth_id column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on auth_id for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Update RLS policies for authenticated users
DROP POLICY IF EXISTS "Public read access" ON users;
DROP POLICY IF EXISTS "Public write access" ON users;

-- Users can read their own data and public profiles
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = auth_id OR auth_id IS NULL);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Allow insert for new user creation
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_id OR auth_id IS NULL);

-- Update other tables to work with authenticated users
-- User inventory policies
DROP POLICY IF EXISTS "Public read access" ON user_inventory;
DROP POLICY IF EXISTS "Public write access" ON user_inventory;

CREATE POLICY "Users can read own inventory" ON user_inventory
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can manage own inventory" ON user_inventory
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- User favorites policies  
DROP POLICY IF EXISTS "Public read access" ON user_favorites;
DROP POLICY IF EXISTS "Public write access" ON user_favorites;

CREATE POLICY "Users can read own favorites" ON user_favorites
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can manage own favorites" ON user_favorites
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Recent wins - allow public read but restrict write
DROP POLICY IF EXISTS "Public write access" ON recent_wins;

CREATE POLICY "Users can create own wins" ON recent_wins
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- User quiz progress policies
DROP POLICY IF EXISTS "Public read access" ON user_quiz_progress;
DROP POLICY IF EXISTS "Public write access" ON user_quiz_progress;

CREATE POLICY "Users can read own quiz progress" ON user_quiz_progress
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can manage own quiz progress" ON user_quiz_progress
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Referral earnings policies
DROP POLICY IF EXISTS "Public read access" ON referral_earnings;
DROP POLICY IF EXISTS "Public write access" ON referral_earnings;

CREATE POLICY "Users can read own referral earnings" ON referral_earnings
  FOR SELECT USING (
    referrer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    referred_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "System can create referral earnings" ON referral_earnings
  FOR INSERT WITH CHECK (true);

-- User promo codes policies
CREATE POLICY "Users can read own promo usage" ON user_promo_codes
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can use promo codes" ON user_promo_codes
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- User Steam settings policies
CREATE POLICY "Users can read own steam settings" ON user_steam_settings
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can manage own steam settings" ON user_steam_settings
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();