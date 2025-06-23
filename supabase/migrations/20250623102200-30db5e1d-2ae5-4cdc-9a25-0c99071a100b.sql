
-- Remove the duplicate safe_open_case function (the one with 4 parameters)
-- We keep only the version with 5 parameters that can handle both skins and coin rewards
DROP FUNCTION IF EXISTS public.safe_open_case(uuid, uuid, uuid, boolean);
