
-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the banner-images bucket
CREATE POLICY "Public can view banner images" ON storage.objects
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
