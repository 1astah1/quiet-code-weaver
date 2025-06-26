
-- Проверим и исправим таблицу user_quiz_profiles
DROP TABLE IF EXISTS user_quiz_profiles CASCADE;

CREATE TABLE user_quiz_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    lives INT NOT NULL DEFAULT 2 CHECK (lives >= 0 AND lives <= 2),
    last_life_lost_at TIMESTAMPTZ,
    last_ad_watched_at TIMESTAMPTZ,
    current_streak INT NOT NULL DEFAULT 0,
    last_quiz_completed_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включаем RLS
ALTER TABLE user_quiz_profiles ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS
CREATE POLICY "Users can view their own quiz profile" 
ON user_quiz_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz profile" 
ON user_quiz_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz profile" 
ON user_quiz_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Проверим таблицу user_quiz_progress
DROP TABLE IF EXISTS user_quiz_progress CASCADE;

CREATE TABLE user_quiz_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    was_correct BOOLEAN NOT NULL,
    PRIMARY KEY (user_id, quiz_id)
);

-- Включаем RLS для user_quiz_progress
ALTER TABLE user_quiz_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz progress" 
ON user_quiz_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz progress" 
ON user_quiz_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Обновим функцию get_quiz_state чтобы она корректно работала
CREATE OR REPLACE FUNCTION get_quiz_state()
RETURNS TABLE (
    lives INT,
    ad_cooldown_seconds BIGINT,
    streak_multiplier REAL,
    reward INT,
    current_question JSONB,
    quiz_progress JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_id UUID := auth.uid();
    profile RECORD;
    lives_to_restore INT;
    time_since_loss BIGINT;
    next_question RECORD;
    total_questions_today INT;
    answered_questions_today INT;
    base_reward INT := 100;
BEGIN
    -- Проверяем, что пользователь аутентифицирован
    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Создаем профиль если его нет
    INSERT INTO user_quiz_profiles (user_id)
    VALUES (auth_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Получаем профиль пользователя
    SELECT * INTO profile FROM user_quiz_profiles WHERE user_quiz_profiles.user_id = auth_user_id;

    -- Проверяем и сбрасываем стрик если нужно
    IF profile.last_quiz_completed_date IS NOT NULL AND profile.last_quiz_completed_date < (current_date - interval '1 day') THEN
        profile.current_streak := 0;
        UPDATE user_quiz_profiles SET current_streak = 0 WHERE user_quiz_profiles.user_id = auth_user_id;
    END IF;

    -- Рассчитываем восстановление жизней
    IF profile.lives < 2 AND profile.last_life_lost_at IS NOT NULL THEN
        time_since_loss := EXTRACT(EPOCH FROM (NOW() - profile.last_life_lost_at));
        lives_to_restore := floor(time_since_loss / (8 * 3600)); -- 8 часов на жизнь

        IF lives_to_restore > 0 THEN
            profile.lives := LEAST(2, profile.lives + lives_to_restore);
            UPDATE user_quiz_profiles 
            SET 
                lives = profile.lives,
                last_life_lost_at = CASE WHEN profile.lives < 2 THEN last_life_lost_at + (lives_to_restore * (8 * 3600) * interval '1 second') ELSE NULL END
            WHERE user_quiz_profiles.user_id = auth_user_id;
        END IF;
    END IF;

    -- Рассчитываем кулдаун рекламы
    IF profile.last_ad_watched_at IS NOT NULL THEN
        ad_cooldown_seconds := GREATEST(0, (8 * 3600) - EXTRACT(EPOCH FROM (NOW() - profile.last_ad_watched_at)));
    ELSE
        ad_cooldown_seconds := 0;
    END IF;

    -- Получаем количество вопросов на сегодня
    SELECT COUNT(*) INTO total_questions_today FROM quizzes WHERE active = true;
    SELECT COUNT(*) INTO answered_questions_today FROM user_quiz_progress
    WHERE user_quiz_progress.user_id = auth_user_id AND date(answered_at) = current_date;

    -- Находим следующий неотвеченный вопрос
    SELECT
        q.id,
        q.question_text,
        q.image_url,
        jsonb_agg(jsonb_build_object('id', a.id, 'answer_text', a.answer_text)) as answers
    INTO next_question
    FROM quizzes q
    JOIN quiz_answers a ON q.id = a.quiz_id
    WHERE 
        q.active = true
        AND NOT EXISTS (
            SELECT 1 FROM user_quiz_progress up
            WHERE up.quiz_id = q.id AND up.user_id = auth_user_id AND date(up.answered_at) = current_date
        )
    GROUP BY q.id, q.question_text, q.image_url
    ORDER BY q.created_at
    LIMIT 1;

    -- Рассчитываем мультипликатор и награду
    streak_multiplier := 1.0 + (profile.current_streak * 0.1);
    reward := floor(base_reward * streak_multiplier);

    RETURN QUERY SELECT
        profile.lives,
        ad_cooldown_seconds,
        streak_multiplier,
        reward,
        CASE 
            WHEN next_question.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', next_question.id,
                    'question_text', next_question.question_text,
                    'image_url', next_question.image_url,
                    'answers', next_question.answers
                )
            ELSE NULL
        END AS current_question,
        jsonb_build_object(
            'current', CASE WHEN answered_questions_today >= total_questions_today THEN total_questions_today ELSE answered_questions_today + 1 END,
            'total', total_questions_today
        ) AS quiz_progress;
END;
$$;

-- Даем права на выполнение функций
GRANT EXECUTE ON FUNCTION get_quiz_state() TO authenticated;
GRANT EXECUTE ON FUNCTION answer_quiz_question(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_life_for_ad() TO authenticated;
