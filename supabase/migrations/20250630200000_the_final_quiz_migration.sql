BEGIN;

-- 1. DROP EVERYTHING related to the old quiz system to ensure a clean slate.
-- Drop tables in reverse order of dependency
DROP TABLE IF EXISTS user_quiz_answers CASCADE;
DROP TABLE IF EXISTS quiz_rewards CASCADE;
DROP TABLE IF EXISTS user_quiz_progress CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;

-- Drop old functions that might still exist
DROP FUNCTION IF EXISTS "DEPRECATED_process_quiz_answer"(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS "DEPRECATED_get_random_quiz_question"(UUID, TEXT);
DROP FUNCTION IF EXISTS "DEPRECATED_restore_heart_by_ad"(UUID);
DROP FUNCTION IF EXISTS "DEPRECATED_auto_restore_heart"(UUID);
DROP FUNCTION IF EXISTS get_random_quiz_question(uuid,text);
DROP FUNCTION IF EXISTS process_quiz_answer(uuid,uuid,text);
DROP FUNCTION IF EXISTS restore_heart_by_ad(uuid);
DROP FUNCTION IF EXISTS auto_restore_heart(uuid);

-- 2. RECREATE the entire schema from scratch.
-- quiz_questions table
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  answers JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  image_url TEXT,
  difficulty INTEGER DEFAULT 1,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_quiz_progress table
CREATE TABLE user_quiz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  hearts INTEGER DEFAULT 5,
  last_heart_restore TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  total_rewards_earned NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_quiz_answers table
CREATE TABLE user_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- quiz_rewards table
CREATE TABLE quiz_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  questions_required INTEGER NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
-- quiz_questions
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to quiz questions" ON quiz_questions FOR SELECT USING (true);
-- user_quiz_progress
ALTER TABLE user_quiz_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own quiz progress" ON user_quiz_progress FOR ALL USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
-- user_quiz_answers
ALTER TABLE user_quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own quiz answers" ON user_quiz_answers FOR ALL USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
-- quiz_rewards
ALTER TABLE quiz_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own quiz rewards" ON quiz_rewards FOR ALL USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Insert initial data
INSERT INTO quiz_questions (text, answers, correct_answer, category) VALUES
('Какой самый популярный скин в CS2?', '["AK-47 | Redline", "AWP | Dragon Lore", "M4A4 | Howl", "UMP-45 | Crime"]', 'AK-47 | Redline', 'Skins'),
('В каком году вышла CS:GO?', '["2010", "2011", "2012", "2013"]', '2012', 'History'),
('Какая карта была удалена из соревновательного маппула в 2022?', '["Train", "Mirage", "Dust II", "Cache"]', 'Train', 'Maps');

-- 3. RECREATE the RPC functions.
-- get_user_quiz_state function
CREATE OR REPLACE FUNCTION get_user_quiz_state(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_progress RECORD;
    v_question RECORD;
    v_restored_hearts INT;
    v_time_since_last_restore INTERVAL;
    v_max_hearts INT := 5;
    v_heart_restore_interval INTERVAL := '30 minutes';
    v_next_heart_restores_in INTERVAL;
BEGIN
    SELECT * INTO v_progress FROM user_quiz_progress WHERE user_id = p_user_id;
    IF NOT FOUND THEN
        INSERT INTO user_quiz_progress (user_id) VALUES (p_user_id) RETURNING * INTO v_progress;
    END IF;

    IF v_progress.hearts < v_max_hearts THEN
        v_time_since_last_restore := NOW() - v_progress.last_heart_restore;
        v_restored_hearts := floor(EXTRACT(EPOCH FROM v_time_since_last_restore) / EXTRACT(EPOCH FROM v_heart_restore_interval));
        IF v_restored_hearts > 0 THEN
            UPDATE user_quiz_progress
            SET
                hearts = LEAST(v_max_hearts, v_progress.hearts + v_restored_hearts),
                last_heart_restore = v_progress.last_heart_restore + (v_restored_hearts * v_heart_restore_interval)
            WHERE user_id = p_user_id
            RETURNING * INTO v_progress;
        END IF;
    END IF;

    IF v_progress.hearts < v_max_hearts THEN
        v_next_heart_restores_in := (v_progress.last_heart_restore + v_heart_restore_interval) - NOW();
        IF v_next_heart_restores_in < '0 seconds'::interval THEN v_next_heart_restores_in := '0 seconds'::interval; END IF;
    ELSE
        v_next_heart_restores_in := NULL;
    END IF;

    SELECT qq.id, qq.text, qq.answers, qq.image_url INTO v_question
    FROM quiz_questions qq
    WHERE qq.id NOT IN (SELECT uqa.question_id FROM user_quiz_answers uqa WHERE uqa.user_id = p_user_id)
    ORDER BY random() LIMIT 1;

    RETURN jsonb_build_object(
        'progress', to_jsonb(v_progress),
        'question', to_jsonb(v_question),
        'next_heart_restores_in_seconds', floor(EXTRACT(EPOCH FROM v_next_heart_restores_in))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- answer_quiz_question function
CREATE OR REPLACE FUNCTION answer_quiz_question(p_user_id UUID, p_question_id UUID, p_user_answer TEXT)
RETURNS JSONB AS $$
DECLARE
  v_question RECORD;
  v_progress RECORD;
  v_is_correct BOOLEAN;
  v_reward_milestones INT[] := ARRAY[5, 10, 20, 30];
  v_milestone INT;
  v_reward_amount INT;
  v_max_hearts INT := 5;
BEGIN
  SELECT * INTO v_progress FROM user_quiz_progress WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'User progress not found.'); END IF;
  IF v_progress.hearts <= 0 THEN RETURN jsonb_build_object('error', 'Not enough hearts to answer.'); END IF;

  SELECT * INTO v_question FROM quiz_questions WHERE id = p_question_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Question not found.'); END IF;

  IF EXISTS (SELECT 1 FROM user_quiz_answers WHERE user_id = p_user_id AND question_id = p_question_id) THEN
      RETURN jsonb_build_object('error', 'Question already answered.');
  END IF;

  v_is_correct := (p_user_answer = v_question.correct_answer);
  INSERT INTO user_quiz_answers (user_id, question_id, user_answer, is_correct) VALUES (p_user_id, p_question_id, p_user_answer, v_is_correct);

  IF v_is_correct THEN
    UPDATE user_quiz_progress SET questions_answered = questions_answered + 1, correct_answers = correct_answers + 1, current_streak = current_streak + 1, updated_at = NOW()
    WHERE user_id = p_user_id RETURNING * INTO v_progress;
  ELSE
    UPDATE user_quiz_progress SET hearts = v_progress.hearts - 1, current_streak = 0, last_heart_restore = CASE WHEN v_progress.hearts = v_max_hearts THEN NOW() ELSE v_progress.last_heart_restore END, updated_at = NOW()
    WHERE user_id = p_user_id RETURNING * INTO v_progress;
  END IF;

  IF v_is_correct THEN
    FOREACH v_milestone IN ARRAY v_reward_milestones
    LOOP
        IF v_progress.correct_answers = v_milestone AND NOT EXISTS (SELECT 1 FROM quiz_rewards WHERE user_id = p_user_id AND questions_required = v_milestone) THEN
            CASE v_milestone
                WHEN 5 THEN v_reward_amount := 50; WHEN 10 THEN v_reward_amount := 100; WHEN 20 THEN v_reward_amount := 250; WHEN 30 THEN v_reward_amount := 500;
                ELSE v_reward_amount := 0;
            END CASE;

            IF v_reward_amount > 0 THEN
                INSERT INTO quiz_rewards (user_id, reward_type, reward_amount, questions_required) VALUES (p_user_id, 'balance', v_reward_amount, v_milestone);
                UPDATE users SET coins = coins + v_reward_amount WHERE id = p_user_id;
                UPDATE user_quiz_progress SET total_rewards_earned = total_rewards_earned + v_reward_amount WHERE user_id = p_user_id;
            END IF;
        END IF;
    END LOOP;
  END IF;
  
  RETURN get_user_quiz_state(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


COMMIT; 