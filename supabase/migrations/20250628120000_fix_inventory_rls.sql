-- Fix RLS policies for user_inventory to prevent "more than one row returned by a subquery" error
-- The issue is that the subquery in the policy can return multiple rows when there are duplicate auth_id entries

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can manage own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can view their own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can update their own inventory" ON user_inventory;

-- Create new policies with proper subquery handling
CREATE POLICY "Users can read own inventory" ON user_inventory
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can manage own inventory" ON user_inventory
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Also fix other tables that might have the same issue
DROP POLICY IF EXISTS "Users can read own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON user_favorites;

CREATE POLICY "Users can read own favorites" ON user_favorites
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can manage own favorites" ON user_favorites
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Users can read own quiz progress" ON user_quiz_progress;
DROP POLICY IF EXISTS "Users can manage own quiz progress" ON user_quiz_progress;

CREATE POLICY "Users can read own quiz progress" ON user_quiz_progress
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can manage own quiz progress" ON user_quiz_progress
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Users can read own promo usage" ON user_promo_codes;
DROP POLICY IF EXISTS "Users can use promo codes" ON user_promo_codes;

CREATE POLICY "Users can read own promo usage" ON user_promo_codes
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can use promo codes" ON user_promo_codes
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Users can read own steam settings" ON user_steam_settings;
DROP POLICY IF EXISTS "Users can manage own steam settings" ON user_steam_settings;

CREATE POLICY "Users can read own steam settings" ON user_steam_settings
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can manage own steam settings" ON user_steam_settings
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Fix user_free_case_openings policies
DROP POLICY IF EXISTS "Users can view their own free case openings" ON user_free_case_openings;
DROP POLICY IF EXISTS "Users can insert their own free case openings" ON user_free_case_openings;

CREATE POLICY "Users can view their own free case openings" 
ON user_free_case_openings FOR SELECT 
USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can insert their own free case openings" 
ON user_free_case_openings FOR INSERT 
WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1));

-- Add unique constraint on auth_id to prevent duplicates
ALTER TABLE users ADD CONSTRAINT unique_auth_id UNIQUE (auth_id);

-- Clean up any duplicate auth_id entries (keep the first one)
DELETE FROM users a USING users b 
WHERE a.id > b.id AND a.auth_id = b.auth_id AND a.auth_id IS NOT NULL; 