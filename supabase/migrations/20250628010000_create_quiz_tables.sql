-- Create the quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE quizzes IS 'Stores quiz questions.';

-- Create the quiz_answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE quiz_answers IS 'Stores answer options for quiz questions.';
CREATE INDEX IF NOT EXISTS quiz_answers_quiz_id_idx ON quiz_answers(quiz_id);

-- Create the user_quiz_profiles table
CREATE TABLE IF NOT EXISTS user_quiz_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    lives INT NOT NULL DEFAULT 2 CHECK (lives >= 0 AND lives <= 2),
    last_life_lost_at TIMESTAMPTZ,
    last_ad_watched_at TIMESTAMPTZ,
    current_streak INT NOT NULL DEFAULT 0,
    last_quiz_completed_date DATE
);
COMMENT ON TABLE user_quiz_profiles IS 'Stores user-specific quiz data like lives, streaks, and cooldowns.';

-- Create the user_quiz_progress table
CREATE TABLE IF NOT EXISTS user_quiz_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    was_correct BOOLEAN NOT NULL,
    PRIMARY KEY (user_id, quiz_id)
);
COMMENT ON TABLE user_quiz_progress IS 'Tracks which questions a user has answered for the current day.';

-- Enable RLS for the new tables
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- It's okay if these fail if they already exist.
DROP POLICY IF EXISTS "Allow read access to active quizzes" ON quizzes;
CREATE POLICY "Allow read access to active quizzes" ON quizzes FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Allow read access to answers of active quizzes" ON quiz_answers;
CREATE POLICY "Allow read access to answers of active quizzes" ON quiz_answers FOR SELECT USING (
    (SELECT active FROM quizzes WHERE id = quiz_id)
);

DROP POLICY IF EXISTS "Allow users to manage their own profile" ON user_quiz_profiles;
CREATE POLICY "Allow users to manage their own profile" ON user_quiz_profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage their own progress" ON user_quiz_progress;
CREATE POLICY "Allow users to manage their own progress" ON user_quiz_progress FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to ensure a user profile exists
CREATE OR REPLACE FUNCTION public.ensure_user_quiz_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_quiz_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create a profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_quiz_profile();

-- Seed some data for testing, do nothing on conflict
INSERT INTO quizzes (question_text, image_url, active) VALUES
('Какой персонаж нарисован на скине P90 Nostalgia?', 'https://raw.githubusercontent.com/1astah1/quiet-code-weaver/main/public/lovable-uploads/p90-nostalgia.png', true),
('Какое оружие не является пистолетом-пулеметом?', NULL, true)
ON CONFLICT DO NOTHING;

-- Answers for Q1
INSERT INTO quiz_answers (quiz_id, answer_text, is_correct)
SELECT id, 'Спецназ из CS 1.6', true FROM quizzes WHERE question_text LIKE '%Nostalgia%'
ON CONFLICT DO NOTHING;
INSERT INTO quiz_answers (quiz_id, answer_text, is_correct)
SELECT id, 'Солдат SAS', false FROM quizzes WHERE question_text LIKE '%Nostalgia%'
ON CONFLICT DO NOTHING;
INSERT INTO quiz_answers (quiz_id, answer_text, is_correct)
SELECT id, 'Chicken', false FROM quizzes WHERE question_text LIKE '%Nostalgia%'
ON CONFLICT DO NOTHING;
INSERT INTO quiz_answers (quiz_id, answer_text, is_correct)
SELECT id, '«Доктор» Романов', false FROM quizzes WHERE question_text LIKE '%Nostalgia%'
ON CONFLICT DO NOTHING;

-- Answers for Q2
INSERT INTO quiz_answers (quiz_id, answer_text, is_correct)
SELECT id, 'MP9', false FROM quizzes WHERE question_text LIKE '%пистолетом-пулеметом%'
ON CONFLICT DO NOTHING;
INSERT INTO quiz_answers (quiz_id, answer_text, is_correct)
SELECT id, 'Negev', true FROM quizzes WHERE question_text LIKE '%пистолетом-пулеметом%'
ON CONFLICT DO NOTHING;
INSERT INTO quiz_answers (quiz_id, answer_text, is_correct)
SELECT id, 'P90', false FROM quizzes WHERE question_text LIKE '%пистолетом-пулеметом%'
ON CONFLICT DO NOTHING;
INSERT INTO quiz_answers (quiz_id, answer_text, is_correct)
SELECT id, 'UMP-45', false FROM quizzes WHERE question_text LIKE '%пистолетом-пулеметом%'
ON CONFLICT DO NOTHING; 