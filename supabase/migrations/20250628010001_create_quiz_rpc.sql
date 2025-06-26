-- Function to get the user's current quiz state, including regenerated lives
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
    -- Ensure the user has a profile
    INSERT INTO public.user_quiz_profiles (user_id)
    VALUES (auth_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Get the user's profile
    SELECT * INTO profile FROM user_quiz_profiles WHERE user_quiz_profiles.user_id = auth_user_id;

    -- Check and reset streak if needed
    IF profile.last_quiz_completed_date IS NOT NULL AND profile.last_quiz_completed_date < (current_date - interval '1 day') THEN
        profile.current_streak := 0;
        UPDATE user_quiz_profiles SET current_streak = 0 WHERE user_quiz_profiles.user_id = auth_user_id;
    END IF;

    -- Calculate regenerated lives
    IF profile.lives < 2 AND profile.last_life_lost_at IS NOT NULL THEN
        time_since_loss := EXTRACT(EPOCH FROM (NOW() - profile.last_life_lost_at));
        lives_to_restore := floor(time_since_loss / (8 * 3600)); -- 8 hours per life

        IF lives_to_restore > 0 THEN
            profile.lives := LEAST(2, profile.lives + lives_to_restore);
            UPDATE user_quiz_profiles 
            SET 
                lives = profile.lives,
                last_life_lost_at = CASE WHEN profile.lives < 2 THEN last_life_lost_at + (lives_to_restore * (8 * 3600) * interval '1 second') ELSE NULL END
            WHERE user_quiz_profiles.user_id = auth_user_id;
        END IF;
    END IF;

    -- Calculate ad cooldown
    IF profile.last_ad_watched_at IS NOT NULL THEN
        ad_cooldown_seconds := GREATEST(0, (8 * 3600) - EXTRACT(EPOCH FROM (NOW() - profile.last_ad_watched_at)));
    ELSE
        ad_cooldown_seconds := 0;
    END IF;

    -- Get today's quiz questions
    SELECT COUNT(*) INTO total_questions_today FROM quizzes WHERE active = true;
    SELECT COUNT(*) INTO answered_questions_today FROM user_quiz_progress
    WHERE user_quiz_progress.user_id = auth_user_id AND date(answered_at) = current_date;

    -- Find the next unanswered question for today
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

    -- Calculate streak multiplier and reward
    streak_multiplier := 1.0 + (profile.current_streak * 0.1);
    reward := floor(base_reward * streak_multiplier);

    RETURN QUERY SELECT
        profile.lives,
        ad_cooldown_seconds,
        streak_multiplier,
        reward,
        jsonb_build_object(
            'id', next_question.id,
            'question_text', next_question.question_text,
            'image_url', next_question.image_url,
            'answers', next_question.answers
        ) AS current_question,
        jsonb_build_object(
            'current', answered_questions_today + 1,
            'total', total_questions_today
        ) AS quiz_progress;
END;
$$;


-- Function to answer a quiz question
CREATE OR REPLACE FUNCTION answer_quiz_question(p_answer_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    correct BOOLEAN,
    message TEXT,
    new_lives INT,
    new_balance BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_id UUID := auth.uid();
    profile RECORD;
    v_answer RECORD;
    is_quiz_complete BOOLEAN := false;
    total_questions_today INT;
    answered_questions_today INT;
    base_reward INT := 100;
    final_reward INT;
BEGIN
    -- Get user profile and lock the row
    SELECT * INTO profile FROM user_quiz_profiles WHERE user_quiz_profiles.user_id = auth_user_id FOR UPDATE;

    -- Check if user has lives
    IF profile.lives <= 0 THEN
        RETURN QUERY SELECT false, NULL, 'У вас закончились жизни.', profile.lives, NULL::BIGINT;
    END IF;

    -- Get the answer and the question it belongs to
    SELECT a.*, q.id as question_id INTO v_answer
    FROM quiz_answers a
    JOIN quizzes q ON a.quiz_id = q.id
    WHERE a.id = p_answer_id;

    -- Check if question was already answered today
    IF EXISTS (
        SELECT 1 FROM user_quiz_progress up
        WHERE up.user_id = auth_user_id AND up.quiz_id = v_answer.question_id AND date(up.answered_at) = current_date
    ) THEN
        RETURN QUERY SELECT false, NULL, 'Вы уже отвечали на этот вопрос сегодня.', profile.lives, NULL::BIGINT;
    END IF;

    -- Record the progress
    INSERT INTO user_quiz_progress (user_id, quiz_id, was_correct)
    VALUES (auth_user_id, v_answer.question_id, v_answer.is_correct);

    IF v_answer.is_correct THEN
        -- Check if all questions for today are answered
        SELECT COUNT(*) INTO total_questions_today FROM quizzes WHERE active = true;
        SELECT COUNT(*) INTO answered_questions_today FROM user_quiz_progress
        WHERE user_quiz_progress.user_id = auth_user_id AND date(answered_at) = current_date AND was_correct = true;

        IF answered_questions_today >= total_questions_today THEN
            is_quiz_complete := true;
            profile.current_streak := profile.current_streak + 1;
            profile.last_quiz_completed_date := current_date;
            
            -- Calculate reward
            final_reward := floor(base_reward * (1.0 + (profile.current_streak * 0.1)));

            -- Update user's balance
            UPDATE public.users SET balance = balance + final_reward WHERE id = auth_user_id;
            new_balance := (SELECT balance FROM public.users WHERE id = auth_user_id);

            UPDATE user_quiz_profiles
            SET current_streak = profile.current_streak, last_quiz_completed_date = profile.last_quiz_completed_date
            WHERE user_quiz_profiles.user_id = auth_user_id;
        END IF;

        RETURN QUERY SELECT true, true, CASE WHEN is_quiz_complete THEN 'Поздравляем! Вы прошли викторину!' ELSE 'Правильный ответ!' END, profile.lives, new_balance;

    ELSE
        -- Decrement lives
        profile.lives := profile.lives - 1;
        UPDATE user_quiz_profiles
        SET lives = profile.lives, last_life_lost_at = NOW()
        WHERE user_quiz_profiles.user_id = auth_user_id;

        RETURN QUERY SELECT true, false, 'Неправильный ответ.', profile.lives, NULL::BIGINT;
    END IF;

END;
$$;


-- Function to get a life by watching an ad
CREATE OR REPLACE FUNCTION get_life_for_ad()
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    new_lives INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_id UUID := auth.uid();
    profile RECORD;
BEGIN
    -- Get user profile and lock the row
    SELECT * INTO profile FROM user_quiz_profiles WHERE user_quiz_profiles.user_id = auth_user_id FOR UPDATE;

    -- Check cooldown
    IF profile.last_ad_watched_at IS NOT NULL AND (NOW() - profile.last_ad_watched_at) < interval '8 hours' THEN
        RETURN QUERY SELECT false, 'Вы можете получить жизнь за рекламу только раз в 8 часов.', profile.lives;
    END IF;

    -- Check if lives are full
    IF profile.lives >= 2 THEN
        RETURN QUERY SELECT false, 'У вас уже максимальное количество жизней.', profile.lives;
    END IF;

    -- Grant a life
    profile.lives := profile.lives + 1;
    UPDATE user_quiz_profiles
    SET lives = profile.lives, last_ad_watched_at = NOW()
    WHERE user_quiz_profiles.user_id = auth_user_id;

    RETURN QUERY SELECT true, 'Вы получили одну жизнь!', profile.lives;
END;
$$;

-- Grant execution rights to the authenticated role
GRANT EXECUTE ON FUNCTION get_quiz_state() TO authenticated;
GRANT EXECUTE ON FUNCTION answer_quiz_question(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_life_for_ad() TO authenticated; 