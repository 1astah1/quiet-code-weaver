
-- Create the case-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-images', 'case-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the case-images bucket
CREATE POLICY "Public can view case images" ON storage.objects
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
