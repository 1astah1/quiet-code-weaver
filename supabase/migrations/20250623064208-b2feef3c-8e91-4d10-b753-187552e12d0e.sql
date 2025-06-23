
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read data" ON public.users;
DROP POLICY IF EXISTS "Users can update data" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Users can read own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can manage own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can read own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can read own quiz progress" ON public.user_quiz_progress;
DROP POLICY IF EXISTS "Users can manage own quiz progress" ON public.user_quiz_progress;
DROP POLICY IF EXISTS "Users can read own referral earnings" ON public.referral_earnings;
DROP POLICY IF EXISTS "System can create referral earnings" ON public.referral_earnings;
DROP POLICY IF EXISTS "Anyone can read recent wins" ON public.recent_wins;
DROP POLICY IF EXISTS "System can create wins" ON public.recent_wins;
DROP POLICY IF EXISTS "Users can create own wins" ON public.recent_wins;

-- Enable RLS only on actual tables (not views)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_free_case_openings ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for users table
CREATE POLICY "Users can read data" ON public.users
  FOR SELECT USING (
    auth.uid() = auth_id OR 
    public.is_admin_user()
  );

CREATE POLICY "Users can update data" ON public.users
  FOR UPDATE USING (
    auth.uid() = auth_id OR 
    public.is_admin_user()
  );

CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() = auth_id OR 
    public.is_admin_user()
  );

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (
    public.is_admin_user()
  );

-- Secure policies for user_inventory
CREATE POLICY "Users can read own inventory" ON public.user_inventory
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

CREATE POLICY "Users can manage own inventory" ON public.user_inventory
  FOR ALL USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

-- Secure policies for user_favorites
CREATE POLICY "Users can read own favorites" ON public.user_favorites
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

CREATE POLICY "Users can manage own favorites" ON public.user_favorites
  FOR ALL USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

-- Secure policies for user_quiz_progress
CREATE POLICY "Users can read own quiz progress" ON public.user_quiz_progress
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

CREATE POLICY "Users can manage own quiz progress" ON public.user_quiz_progress
  FOR ALL USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

-- Secure policies for referral_earnings
CREATE POLICY "Users can read own referral earnings" ON public.referral_earnings
  FOR SELECT USING (
    referrer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    referred_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

CREATE POLICY "System can create referral earnings" ON public.referral_earnings
  FOR INSERT WITH CHECK (
    public.is_admin_user()
  );

-- Secure policies for recent_wins (public read for live feed, restricted write)
CREATE POLICY "Anyone can read recent wins" ON public.recent_wins
  FOR SELECT USING (true);

CREATE POLICY "System can create wins" ON public.recent_wins
  FOR INSERT WITH CHECK (
    public.is_admin_user() OR
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Secure policies for security_audit_log
CREATE POLICY "Admins can read all audit logs" ON public.security_audit_log
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Users can read own audit logs" ON public.security_audit_log
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "System can create audit logs" ON public.security_audit_log
  FOR INSERT WITH CHECK (true);

-- Secure policies for coin_rewards (admin managed)
CREATE POLICY "Anyone can read coin rewards" ON public.coin_rewards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage coin rewards" ON public.coin_rewards
  FOR ALL USING (public.is_admin_user());

-- Secure policies for daily_rewards (admin managed)
CREATE POLICY "Anyone can read daily rewards" ON public.daily_rewards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage daily rewards" ON public.daily_rewards
  FOR ALL USING (public.is_admin_user());

-- Secure policies for user_daily_rewards
CREATE POLICY "Users can read own daily rewards" ON public.user_daily_rewards
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

CREATE POLICY "Users can claim daily rewards" ON public.user_daily_rewards
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

-- Secure policies for user_free_case_openings
CREATE POLICY "Users can read own free case openings" ON public.user_free_case_openings
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

CREATE POLICY "Users can track free case openings" ON public.user_free_case_openings
  FOR ALL USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    public.is_admin_user()
  );

-- Add enhanced admin verification function
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists and is admin
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  );
END;
$$;

-- Enhanced audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_action text,
  p_details jsonb DEFAULT '{}',
  p_success boolean DEFAULT true,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    details,
    success,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_details,
    p_success,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Enhanced rate limiting function with IP tracking
CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(
  p_user_id uuid DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_action_type text DEFAULT 'general',
  p_max_attempts integer DEFAULT 5,
  p_time_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count INTEGER := 0;
BEGIN
  -- Check rate limit by user_id if provided
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO attempt_count
    FROM public.security_audit_log
    WHERE user_id = p_user_id
      AND action = p_action_type
      AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  END IF;
  
  -- Check rate limit by IP if provided and user check passed
  IF attempt_count < p_max_attempts AND p_ip_address IS NOT NULL THEN
    SELECT COUNT(*)
    INTO attempt_count
    FROM public.security_audit_log
    WHERE ip_address = p_ip_address
      AND action = p_action_type
      AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  END IF;
  
  RETURN attempt_count < p_max_attempts;
END;
$$;
