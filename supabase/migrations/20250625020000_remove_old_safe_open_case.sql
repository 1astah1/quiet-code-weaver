-- Удаляем старую функцию safe_open_case с параметром p_ad_watched
DROP FUNCTION IF EXISTS public.safe_open_case(uuid, uuid, uuid, uuid, boolean, boolean); 