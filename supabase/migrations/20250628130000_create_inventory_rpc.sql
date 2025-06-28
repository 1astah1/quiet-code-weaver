-- Create RPC function to safely get user inventory without RLS issues
CREATE OR REPLACE FUNCTION get_user_inventory(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  skin_id UUID,
  is_sold BOOLEAN,
  obtained_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  sold_price INTEGER,
  skin_name TEXT,
  skin_weapon_type TEXT,
  skin_rarity TEXT,
  skin_price INTEGER,
  skin_image_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the user exists and get their auth_id
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id_param 
    AND auth_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Return inventory with skin data
  RETURN QUERY
  SELECT 
    ui.id,
    ui.user_id,
    ui.skin_id,
    ui.is_sold,
    ui.obtained_at,
    ui.sold_at,
    ui.sold_price,
    s.name as skin_name,
    s.weapon_type as skin_weapon_type,
    s.rarity as skin_rarity,
    s.price as skin_price,
    s.image_url as skin_image_url
  FROM user_inventory ui
  LEFT JOIN skins s ON ui.skin_id = s.id
  WHERE ui.user_id = user_id_param
    AND ui.is_sold = false
  ORDER BY ui.obtained_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_inventory(UUID) TO authenticated; 