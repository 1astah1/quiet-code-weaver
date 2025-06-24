
-- Add missing columns to users table for quiz life restoration tracking
ALTER TABLE public.users 
ADD COLUMN last_life_restore timestamp with time zone,
ADD COLUMN last_ad_life_restore timestamp with time zone;
