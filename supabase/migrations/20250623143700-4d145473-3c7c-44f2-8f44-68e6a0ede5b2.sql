
-- Drop ALL existing policies for storage.objects to avoid conflicts
DO $$ 
BEGIN
  -- Drop case-images policies
  DROP POLICY IF EXISTS "Public can view case images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload case images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update case images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete case images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can upload case images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update case images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete case images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view case images" ON storage.objects;
  
  -- Drop banner-images policies
  DROP POLICY IF EXISTS "Public can view banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can upload banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view banner images" ON storage.objects;
END $$;

-- Create comprehensive RLS policies for case-images bucket
CREATE POLICY "Anyone can view case images" ON storage.objects
FOR SELECT USING (bucket_id = 'case-images');

CREATE POLICY "Admins can upload case images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'case-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "Admins can update case images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'case-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "Admins can delete case images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'case-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  )
);

-- Create comprehensive RLS policies for banner-images bucket
CREATE POLICY "Anyone can view banner images" ON storage.objects
FOR SELECT USING (bucket_id = 'banner-images');

CREATE POLICY "Admins can upload banner images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'banner-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "Admins can update banner images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'banner-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "Admins can delete banner images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'banner-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  )
);

-- Ensure both buckets exist and are public
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-images', 'case-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
