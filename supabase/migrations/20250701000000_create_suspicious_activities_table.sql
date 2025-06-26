-- Тип для событий безопасности
CREATE TYPE security_event_type AS ENUM (
    'rate_limit',
    'validation_error',
    'suspicious_activity',
    'auth_error',
    'manual_flag'
);

-- Таблица для хранения подозрительной активности
CREATE TABLE "public"."suspicious_activities" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid,
    "type" security_event_type NOT NULL,
    "details" jsonb,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Начальный владелец таблицы
ALTER TABLE "public"."suspicious_activities" OWNER TO "postgres";

-- Описание таблицы и колонок
COMMENT ON TABLE "public"."suspicious_activities" IS 'Stores records of suspicious user activities for security monitoring.';
COMMENT ON COLUMN "public"."suspicious_activities"."user_id" IS 'The user associated with the activity, if any.';
COMMENT ON COLUMN "public"."suspicious_activities"."type" IS 'The category of the suspicious event.';
COMMENT ON COLUMN "public"."suspicious_activities"."details" IS 'Detailed information about the event, like IP address, user agent, etc.';

-- Установка первичного ключа
ALTER TABLE ONLY "public"."suspicious_activities"
    ADD CONSTRAINT "suspicious_activities_pkey" PRIMARY KEY ("id");

-- Создание внешнего ключа для user_id
ALTER TABLE "public"."suspicious_activities"
    ADD CONSTRAINT "suspicious_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- Включаем Row Level Security
ALTER TABLE "public"."suspicious_activities" ENABLE ROW LEVEL SECURITY;

-- Политики RLS
-- 1. Админы могут видеть все записи
CREATE POLICY "Allow admins full access to view"
    ON "public"."suspicious_activities"
    FOR SELECT
    USING ((SELECT is_admin FROM public.users WHERE auth_id = auth.uid()));

-- 2. Запретить кому-либо (кроме ролей, обходящих RLS) изменять или удалять записи
CREATE POLICY "Disallow updates"
    ON "public"."suspicious_activities"
    FOR UPDATE
    USING (false);

CREATE POLICY "Disallow deletes"
    ON "public"."suspicious_activities"
    FOR DELETE
    USING (false);

-- Индексы для ускорения запросов
CREATE INDEX "suspicious_activities_user_id_idx" ON "public"."suspicious_activities" USING "btree" ("user_id");
CREATE INDEX "suspicious_activities_type_idx" ON "public"."suspicious_activities" USING "btree" ("type");
CREATE INDEX "suspicious_activities_created_at_idx" ON "public"."suspicious_activities" USING "btree" ("created_at");

-- RPC функция для логирования событий
CREATE OR REPLACE FUNCTION public.log_suspicious_activity(
    p_user_id uuid,
    p_type security_event_type,
    p_details jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.suspicious_activities (user_id, type, details)
    VALUES (p_user_id, p_type, p_details);
END;
$$;

-- Добавляем в grants
GRANT ALL ON TABLE "public"."suspicious_activities" TO "service_role";
GRANT SELECT ON TABLE "public"."suspicious_activities" TO "anon";
GRANT SELECT ON TABLE "public"."suspicious_activities" TO "authenticated";

GRANT EXECUTE ON FUNCTION public.log_suspicious_activity(uuid, security_event_type, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_suspicious_activity(uuid, security_event_type, jsonb) TO service_role; 