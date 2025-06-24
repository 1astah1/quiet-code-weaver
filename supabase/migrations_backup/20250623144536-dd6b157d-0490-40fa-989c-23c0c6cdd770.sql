
-- Fix RLS policies for storage.objects with proper admin checks
-- Drop existing problematic policies
DO $$ 
BEGIN
  -- Drop all existing policies to start fresh
  DROP POLICY IF EXISTS "Anyone can view case images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can upload case images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update case images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete case images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can upload banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete banner images" ON storage.objects;
  
  -- Also drop any other potential conflicting policies
  DROP POLICY IF EXISTS "Public can view case images" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload case images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read access to banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete banner images" ON storage.objects;
EXCEPTION
  WHEN OTHERS THEN NULL; -- Ignore errors if policies don't exist
END $$;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_storage_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  );
$$;

-- Create comprehensive RLS policies using the security definer function
-- Case images policies
CREATE POLICY "case_images_select" ON storage.objects
FOR SELECT USING (bucket_id = 'case-images');

CREATE POLICY "case_images_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'case-images' AND 
  public.is_storage_admin()
);

CREATE POLICY "case_images_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'case-images' AND 
  public.is_storage_admin()
);

CREATE POLICY "case_images_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'case-images' AND 
  public.is_storage_admin()
);

-- Banner images policies
CREATE POLICY "banner_images_select" ON storage.objects
FOR SELECT USING (bucket_id = 'banner-images');

CREATE POLICY "banner_images_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'banner-images' AND 
  public.is_storage_admin()
);

CREATE POLICY "banner_images_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'banner-images' AND 
  public.is_storage_admin()
);

CREATE POLICY "banner_images_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'banner-images' AND 
  public.is_storage_admin()
);

-- Ensure buckets exist and are properly configured
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('case-images', 'case-images', true),
  ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  name = EXCLUDED.name;
