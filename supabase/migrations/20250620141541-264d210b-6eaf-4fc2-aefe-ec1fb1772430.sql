
-- Очищаем все пользовательские данные
DELETE FROM public.user_inventory;
DELETE FROM public.user_quiz_progress;
DELETE FROM public.recent_wins;
DELETE FROM public.referral_earnings;
DELETE FROM public.user_promo_codes;
DELETE FROM public.user_favorites;
DELETE FROM public.user_achievements;
DELETE FROM public.user_freebie_claims;
DELETE FROM public.user_goals;
DELETE FROM public.user_steam_settings;
DELETE FROM public.user_settings;

-- Удаляем всех пользователей из публичной таблицы
DELETE FROM public.users;

-- Удаляем пользователей из auth.users (это удалит их аккаунты полностью)
-- ВНИМАНИЕ: Это действие необратимо!
DELETE FROM auth.users;

-- Сбрасываем счетчики и статистику
UPDATE public.cases SET likes_count = 0;
UPDATE public.promo_codes SET current_uses = 0;

-- Очищаем кэш сессий (удаляем активные сессии)
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
