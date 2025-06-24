
-- Create storage bucket for case and product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-images', 'case-images', true);

-- Create policies for the bucket to allow public access
CREATE POLICY "Public can view case images" ON storage.objects
FOR SELECT USING (bucket_id = 'case-images');

CREATE POLICY "Authenticated users can upload case images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'case-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update case images" ON storage.objects
FOR UPDATE USING (bucket_id = 'case-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete case images" ON storage.objects
FOR DELETE USING (bucket_id = 'case-images' AND auth.role() = 'authenticated');
