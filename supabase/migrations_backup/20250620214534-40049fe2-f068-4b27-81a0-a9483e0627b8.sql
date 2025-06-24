
-- Enable RLS on banners table
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read active banners
CREATE POLICY "Allow public read access to active banners"
ON public.banners FOR SELECT
TO public
USING (is_active = true);

-- Create policy to allow admin users to manage banners
CREATE POLICY "Allow admin users to manage banners"
ON public.banners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND is_admin = true
  )
);
