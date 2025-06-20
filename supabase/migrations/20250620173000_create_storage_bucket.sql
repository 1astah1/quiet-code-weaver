
-- Создаем bucket для изображений кейсов и скинов
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-images', 'case-images', true);

-- Создаем политики для bucket
CREATE POLICY "Admins can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'case-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "Anyone can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'case-images');

CREATE POLICY "Admins can update images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'case-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "Admins can delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'case-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  )
);
