
-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true);

-- Create policy to allow authenticated users to upload banner images
CREATE POLICY "Allow authenticated users to upload banner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banner-images');

-- Create policy to allow public read access to banner images
CREATE POLICY "Allow public read access to banner images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banner-images');

-- Create policy to allow authenticated users to update banner images
CREATE POLICY "Allow authenticated users to update banner images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banner-images');

-- Create policy to allow authenticated users to delete banner images
CREATE POLICY "Allow authenticated users to delete banner images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banner-images');
