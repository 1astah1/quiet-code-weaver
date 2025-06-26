-- Drop the old table completely to ensure a fresh start
DROP TABLE IF EXISTS public.user_favorites CASCADE;

-- Create the user_favorites table
CREATE TABLE public.user_favorites (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skin_id UUID NOT NULL REFERENCES public.skins(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, skin_id)
);

COMMENT ON TABLE public.user_favorites IS 'Stores the favorite skins for each user.';

-- Enable Row Level Security
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_skin_id_idx ON public.user_favorites(skin_id);

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own favorites" ON public.user_favorites;
CREATE POLICY "Users can read their own favorites" ON public.user_favorites
FOR SELECT
USING (auth.uid() = user_id); 