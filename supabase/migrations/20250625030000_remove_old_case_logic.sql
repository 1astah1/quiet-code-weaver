-- Удаление старых функций и таблиц, связанных с кейсами
DROP FUNCTION IF EXISTS public.safe_open_case_with_session(uuid, uuid, text, uuid, uuid, boolean, boolean);
DROP FUNCTION IF EXISTS public.safe_open_case(uuid, uuid, uuid, uuid, boolean, boolean);
DROP FUNCTION IF EXISTS public.safe_open_case(uuid, uuid, uuid, uuid, boolean);
DROP FUNCTION IF EXISTS public.safe_sell_case_reward(uuid, uuid, integer);
DROP TABLE IF EXISTS public.case_opening_sessions;
DROP TABLE IF EXISTS public.user_free_case_openings;
-- (Добавьте сюда другие связанные таблицы, если есть) 