-- Исправление ошибки с колонкой category
-- Добавляем колонку category если её нет
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_questions' AND column_name = 'category'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN category TEXT DEFAULT 'general';
  END IF;
END $$;

-- Добавляем колонку difficulty если её нет
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_questions' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN difficulty INTEGER DEFAULT 1;
  END IF;
END $$;

-- Обновляем существующие вопросы
UPDATE quiz_questions 
SET category = 'general' 
WHERE category IS NULL;

UPDATE quiz_questions 
SET difficulty = 1 
WHERE difficulty IS NULL;

-- Пересоздаем функцию с исправлениями
CREATE OR REPLACE FUNCTION get_random_quiz_question(
  user_id_param UUID,
  category_param TEXT DEFAULT 'general'
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  answers JSONB,
  correct_answer TEXT,
  image_url TEXT,
  difficulty INTEGER,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qq.id,
    qq.text,
    qq.answers,
    qq.correct_answer,
    qq.image_url,
    COALESCE(qq.difficulty, 1) as difficulty,
    COALESCE(qq.category, 'general') as category
  FROM quiz_questions qq
  WHERE COALESCE(qq.category, 'general') = category_param
    AND qq.id NOT IN (
      SELECT uqa.question_id 
      FROM user_quiz_answers uqa 
      WHERE uqa.user_id = user_id_param
    )
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 