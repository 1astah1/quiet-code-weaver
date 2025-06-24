
-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the banner-images bucket
CREATE POLICY "Public can view banner images" ON storage.objects
FOR SELECT USING (bucket_id = 'banner-images');

CREATE POLICY "Authenticated users can upload banner images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'banner-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update banner images" ON storage.objects
FOR UPDATE USING (bucket_id = 'banner-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete banner images" ON storage.objects
FOR DELETE USING (bucket_id = 'banner-images' AND auth.role() = 'authenticated');
