
-- Ensure case-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-images', 'case-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure banner-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "case_images_select" ON storage.objects;
DROP POLICY IF EXISTS "case_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "case_images_update" ON storage.objects;
DROP POLICY IF EXISTS "case_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "banner_images_select" ON storage.objects;
DROP POLICY IF EXISTS "banner_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "banner_images_update" ON storage.objects;
DROP POLICY IF EXISTS "banner_images_delete" ON storage.objects;

-- Create comprehensive RLS policies for case-images bucket
CREATE POLICY "case_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'case-images');

CREATE POLICY "case_images_admin_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'case-images' AND 
  public.is_storage_admin()
);

CREATE POLICY "case_images_admin_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'case-images' AND 
  public.is_storage_admin()
);

CREATE POLICY "case_images_admin_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'case-images' AND 
  public.is_storage_admin()
);

-- Create comprehensive RLS policies for banner-images bucket
CREATE POLICY "banner_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'banner-images');

CREATE POLICY "banner_images_admin_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'banner-images' AND 
  public.is_storage_admin()
);

CREATE POLICY "banner_images_admin_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'banner-images' AND 
  public.is_storage_admin()
);

CREATE POLICY "banner_images_admin_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'banner-images' AND 
  public.is_storage_admin()
);
