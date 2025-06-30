BEGIN;

-- This migration adjusts the quiz configuration based on new requirements.
-- It sets the maximum hearts to 2 and updates the reward milestones.

-- 1. Update hearts configuration
ALTER TABLE user_quiz_progress ALTER COLUMN hearts SET DEFAULT 2;

-- We are only setting the default. Existing users' hearts will be handled by the logic.

-- 2. Update RPC functions with new heart and reward logic

-- Function to get the current state of the user's quiz
CREATE OR REPLACE FUNCTION get_user_quiz_state()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_progress RECORD;
    v_question RECORD;
    v_restored_hearts INT;
    v_time_since_last_restore INTERVAL;
    v_max_hearts INT := 2; -- Max hearts set to 2
    v_heart_restore_interval INTERVAL := '30 minutes';
    v_next_heart_restores_in INTERVAL;
BEGIN
    -- Get user_id from the authenticated user
    SELECT id INTO v_user_id FROM public.users WHERE auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'User profile not found. Please try again shortly.');
    END IF;

    -- Get user's quiz progress, or create a new one if it doesn't exist
    SELECT * INTO v_progress FROM user_quiz_progress WHERE user_id = v_user_id;
    IF NOT FOUND THEN
        INSERT INTO user_quiz_progress (user_id) VALUES (v_user_id) RETURNING * INTO v_progress;
    END IF;

    -- Restore hearts based on time passed
    IF v_progress.hearts < v_max_hearts THEN
        v_time_since_last_restore := NOW() - v_progress.last_heart_restore;
        v_restored_hearts := floor(EXTRACT(EPOCH FROM v_time_since_last_restore) / EXTRACT(EPOCH FROM v_heart_restore_interval));
        IF v_restored_hearts > 0 THEN
            UPDATE user_quiz_progress
            SET
                hearts = LEAST(v_max_hearts, v_progress.hearts + v_restored_hearts),
                last_heart_restore = v_progress.last_heart_restore + (v_restored_hearts * v_heart_restore_interval)
            WHERE user_id = v_user_id
            RETURNING * INTO v_progress;
        END IF;
    END IF;

    -- Calculate time until the next heart restore
    IF v_progress.hearts < v_max_hearts THEN
        v_next_heart_restores_in := (v_progress.last_heart_restore + v_heart_restore_interval) - NOW();
        IF v_next_heart_restores_in < '0 seconds'::interval THEN v_next_heart_restores_in := '0 seconds'::interval; END IF;
    ELSE
        v_next_heart_restores_in := NULL;
    END IF;

    -- Select a new random question that the user has not answered yet
    SELECT qq.id, qq.text, qq.answers, qq.image_url INTO v_question
    FROM quiz_questions qq
    WHERE qq.id NOT IN (SELECT uqa.question_id FROM user_quiz_answers uqa WHERE uqa.user_id = v_user_id)
    ORDER BY random() LIMIT 1;

    -- Return the complete state
    RETURN jsonb_build_object(
        'progress', to_jsonb(v_progress),
        'question', to_jsonb(v_question),
        'next_heart_restores_in_seconds', floor(EXTRACT(EPOCH FROM v_next_heart_restores_in))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle a user's answer to a quiz question
CREATE OR REPLACE FUNCTION answer_quiz_question(p_question_id UUID, p_user_answer TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_question RECORD;
  v_progress RECORD;
  v_is_correct BOOLEAN;
  -- UPDATED: New reward milestones
  v_reward_milestones INT[] := ARRAY[5, 10, 20, 30]; 
  v_milestone INT;
  v_reward_amount INT;
  v_max_hearts INT := 2;
BEGIN
  -- Get user_id from the authenticated user
  SELECT id INTO v_user_id FROM public.users WHERE auth_id = auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('error', 'User profile not found.'); END IF;

  -- Get user progress
  SELECT * INTO v_progress FROM user_quiz_progress WHERE user_id = v_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'User progress not found.'); END IF;
  IF v_progress.hearts <= 0 THEN RETURN jsonb_build_object('error', 'Not enough hearts to answer.'); END IF;

  -- Get question details
  SELECT * INTO v_question FROM quiz_questions WHERE id = p_question_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Question not found.'); END IF;

  -- Prevent answering the same question twice
  IF EXISTS (SELECT 1 FROM user_quiz_answers WHERE user_id = v_user_id AND question_id = p_question_id) THEN
      RETURN jsonb_build_object('error', 'Question already answered.');
  END IF;

  -- Check if the answer is correct and record it
  v_is_correct := (p_user_answer = v_question.correct_answer);
  INSERT INTO user_quiz_answers (user_id, question_id, user_answer, is_correct) VALUES (v_user_id, p_question_id, p_user_answer, v_is_correct);

  -- Update progress based on the answer
  IF v_is_correct THEN
    UPDATE user_quiz_progress SET questions_answered = questions_answered + 1, correct_answers = correct_answers + 1, current_streak = current_streak + 1, updated_at = NOW()
    WHERE user_id = v_user_id RETURNING * INTO v_progress;
  ELSE
    UPDATE user_quiz_progress SET hearts = v_progress.hearts - 1, current_streak = 0, last_heart_restore = CASE WHEN v_progress.hearts = v_max_hearts THEN NOW() ELSE v_progress.last_heart_restore END, updated_at = NOW()
    WHERE user_id = v_user_id RETURNING * INTO v_progress;
  END IF;

  -- Check for rewards if the answer was correct
  IF v_is_correct THEN
    FOREACH v_milestone IN ARRAY v_reward_milestones
    LOOP
        IF v_progress.correct_answers = v_milestone AND NOT EXISTS (SELECT 1 FROM quiz_rewards WHERE user_id = v_user_id AND questions_required = v_milestone) THEN
            -- UPDATED: New reward logic
            CASE v_milestone
                WHEN 5 THEN v_reward_amount := 4;
                WHEN 10 THEN v_reward_amount := 8;
                WHEN 20 THEN v_reward_amount := 16;
                WHEN 30 THEN v_reward_amount := 32;
                ELSE v_reward_amount := 0;
            END CASE;

            IF v_reward_amount > 0 THEN
                INSERT INTO quiz_rewards (user_id, reward_type, reward_amount, questions_required) VALUES (v_user_id, 'balance', v_reward_amount, v_milestone);
                UPDATE users SET coins = coins + v_reward_amount WHERE id = v_user_id;
                UPDATE user_quiz_progress SET total_rewards_earned = total_rewards_earned + v_reward_amount WHERE user_id = v_user_id;
            END IF;
        END IF;
    END LOOP;
  END IF;
  
  -- Return the new state to the client
  RETURN get_user_quiz_state();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT; 