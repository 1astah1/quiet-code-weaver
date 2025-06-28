-- Создание системы викторины
-- Таблица для вопросов викторины
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  answers JSONB NOT NULL, -- массив вариантов ответов
  correct_answer TEXT NOT NULL,
  image_url TEXT,
  difficulty INTEGER DEFAULT 1, -- 1-5 сложность
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем колонки если их нет (для совместимости)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_questions' AND column_name = 'category'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN category TEXT DEFAULT 'general';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_questions' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN difficulty INTEGER DEFAULT 1;
  END IF;
END $$;

-- Таблица для прогресса пользователя в викторине
CREATE TABLE IF NOT EXISTS user_quiz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hearts INTEGER DEFAULT 2, -- количество жизней (максимум 2)
  last_heart_restore TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_ad_watch TIMESTAMP WITH TIME ZONE,
  questions_answered INTEGER DEFAULT 0, -- общее количество отвеченных вопросов
  correct_answers INTEGER DEFAULT 0, -- правильные ответы
  current_streak INTEGER DEFAULT 0, -- текущая серия правильных ответов
  total_rewards_earned INTEGER DEFAULT 0, -- общее количество заработанных наград
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Таблица для истории ответов пользователя
CREATE TABLE IF NOT EXISTS user_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для наград викторины
CREATE TABLE IF NOT EXISTS quiz_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 'balance', 'hearts', etc.
  reward_amount INTEGER NOT NULL,
  questions_required INTEGER NOT NULL, -- за сколько вопросов дается награда
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON quiz_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_quiz_progress_user_id ON user_quiz_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_answers_user_id ON user_quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_answers_question_id ON user_quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rewards_user_id ON quiz_rewards(user_id);

-- RLS политики для quiz_questions (публичное чтение)
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to quiz questions" ON quiz_questions
  FOR SELECT USING (true);

-- RLS политики для user_quiz_progress
ALTER TABLE user_quiz_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own quiz progress" ON user_quiz_progress
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
CREATE POLICY "Users can update own quiz progress" ON user_quiz_progress
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
CREATE POLICY "Users can insert own quiz progress" ON user_quiz_progress
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- RLS политики для user_quiz_answers
ALTER TABLE user_quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own quiz answers" ON user_quiz_answers
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
CREATE POLICY "Users can insert own quiz answers" ON user_quiz_answers
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- RLS политики для quiz_rewards
ALTER TABLE quiz_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own quiz rewards" ON quiz_rewards
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
CREATE POLICY "Users can insert own quiz rewards" ON quiz_rewards
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Функция для получения случайного вопроса
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

-- Функция для обработки ответа на вопрос
CREATE OR REPLACE FUNCTION process_quiz_answer(
  user_id_param UUID,
  question_id_param UUID,
  user_answer_param TEXT
)
RETURNS JSONB AS $$
DECLARE
  question_record RECORD;
  is_correct BOOLEAN;
  progress_record RECORD;
  reward_amount INTEGER := 0;
  reward_type TEXT := '';
  new_hearts INTEGER;
  can_watch_ad BOOLEAN := false;
BEGIN
  -- Получаем информацию о вопросе
  SELECT * INTO question_record 
  FROM quiz_questions 
  WHERE id = question_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Question not found');
  END IF;
  
  -- Проверяем правильность ответа
  is_correct := (user_answer_param = question_record.correct_answer);
  
  -- Записываем ответ
  INSERT INTO user_quiz_answers (user_id, question_id, user_answer, is_correct)
  VALUES (user_id_param, question_id_param, user_answer_param, is_correct);
  
  -- Получаем или создаем прогресс пользователя
  SELECT * INTO progress_record 
  FROM user_quiz_progress 
  WHERE user_id = user_id_param;
  
  IF NOT FOUND THEN
    INSERT INTO user_quiz_progress (user_id, hearts, questions_answered, correct_answers)
    VALUES (user_id_param, 2, 0, 0)
    RETURNING * INTO progress_record;
  END IF;
  
  -- Обновляем прогресс
  UPDATE user_quiz_progress 
  SET 
    questions_answered = questions_answered + 1,
    correct_answers = correct_answers + CASE WHEN is_correct THEN 1 ELSE 0 END,
    current_streak = CASE 
      WHEN is_correct THEN current_streak + 1 
      ELSE 0 
    END,
    updated_at = NOW()
  WHERE user_id = user_id_param;
  
  -- Проверяем награды
  IF is_correct THEN
    -- Награда за 5 вопросов
    IF progress_record.questions_answered + 1 = 5 THEN
      reward_amount := 1;
      reward_type := 'balance';
      INSERT INTO quiz_rewards (user_id, reward_type, reward_amount, questions_required)
      VALUES (user_id_param, reward_type, reward_amount, 5);
      
      -- Обновляем баланс пользователя
      UPDATE users SET coins = coins + reward_amount WHERE id = user_id_param;
    END IF;
    
    -- Награда за 10 вопросов
    IF progress_record.questions_answered + 1 = 10 THEN
      reward_amount := 4;
      reward_type := 'balance';
      INSERT INTO quiz_rewards (user_id, reward_type, reward_amount, questions_required)
      VALUES (user_id_param, reward_type, reward_amount, 10);
      
      -- Обновляем баланс пользователя
      UPDATE users SET coins = coins + reward_amount WHERE id = user_id_param;
    END IF;
    
    -- Награда за 20 вопросов
    IF progress_record.questions_answered + 1 = 20 THEN
      reward_amount := 5;
      reward_type := 'balance';
      INSERT INTO quiz_rewards (user_id, reward_type, reward_amount, questions_required)
      VALUES (user_id_param, reward_type, reward_amount, 20);
      
      -- Обновляем баланс пользователя
      UPDATE users SET coins = coins + reward_amount WHERE id = user_id_param;
    END IF;
    
    -- Награда за 30 вопросов
    IF progress_record.questions_answered + 1 = 30 THEN
      reward_amount := 10;
      reward_type := 'balance';
      INSERT INTO quiz_rewards (user_id, reward_type, reward_amount, questions_required)
      VALUES (user_id_param, reward_type, reward_amount, 30);
      
      -- Обновляем баланс пользователя
      UPDATE users SET coins = coins + reward_amount WHERE id = user_id_param;
    END IF;
  END IF;
  
  -- Обрабатываем неправильный ответ
  IF NOT is_correct THEN
    UPDATE user_quiz_progress 
    SET hearts = GREATEST(0, hearts - 1)
    WHERE user_id = user_id_param;
  END IF;
  
  -- Проверяем возможность просмотра рекламы
  IF progress_record.last_ad_watch IS NULL OR 
     EXTRACT(EPOCH FROM (NOW() - progress_record.last_ad_watch)) >= 28800 THEN -- 8 часов
    can_watch_ad := true;
  END IF;
  
  -- Получаем обновленный прогресс
  SELECT hearts INTO new_hearts 
  FROM user_quiz_progress 
  WHERE user_id = user_id_param;
  
  RETURN jsonb_build_object(
    'is_correct', is_correct,
    'reward_amount', reward_amount,
    'reward_type', reward_type,
    'hearts', new_hearts,
    'can_watch_ad', can_watch_ad,
    'questions_answered', progress_record.questions_answered + 1,
    'correct_answers', progress_record.correct_answers + CASE WHEN is_correct THEN 1 ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для восстановления сердца через рекламу
CREATE OR REPLACE FUNCTION restore_heart_by_ad(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  progress_record RECORD;
  time_since_last_ad INTEGER;
BEGIN
  -- Получаем прогресс пользователя
  SELECT * INTO progress_record 
  FROM user_quiz_progress 
  WHERE user_id = user_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User progress not found');
  END IF;
  
  -- Проверяем время с последнего просмотра рекламы
  IF progress_record.last_ad_watch IS NOT NULL THEN
    time_since_last_ad := EXTRACT(EPOCH FROM (NOW() - progress_record.last_ad_watch));
    IF time_since_last_ad < 28800 THEN -- 8 часов
      RETURN jsonb_build_object(
        'error', 'Ad watch cooldown',
        'time_remaining', 28800 - time_since_last_ad
      );
    END IF;
  END IF;
  
  -- Восстанавливаем сердце
  UPDATE user_quiz_progress 
  SET 
    hearts = LEAST(2, hearts + 1),
    last_ad_watch = NOW(),
    updated_at = NOW()
  WHERE user_id = user_id_param;
  
  RETURN jsonb_build_object('success', true, 'hearts', LEAST(2, progress_record.hearts + 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для автоматического восстановления сердца
CREATE OR REPLACE FUNCTION auto_restore_heart(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  progress_record RECORD;
  time_since_last_restore INTEGER;
BEGIN
  -- Получаем прогресс пользователя
  SELECT * INTO progress_record 
  FROM user_quiz_progress 
  WHERE user_id = user_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User progress not found');
  END IF;
  
  -- Проверяем время с последнего восстановления
  time_since_last_restore := EXTRACT(EPOCH FROM (NOW() - progress_record.last_heart_restore));
  
  IF time_since_last_restore >= 28800 THEN -- 8 часов
    UPDATE user_quiz_progress 
    SET 
      hearts = LEAST(2, hearts + 1),
      last_heart_restore = NOW(),
      updated_at = NOW()
    WHERE user_id = user_id_param;
    
    RETURN jsonb_build_object('success', true, 'hearts', LEAST(2, progress_record.hearts + 1));
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'time_remaining', 28800 - time_since_last_restore
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Вставляем тестовые вопросы
INSERT INTO quiz_questions (text, answers, correct_answer, category) VALUES
('Какой цвет у неба?', '["Синий", "Зелёный", "Красный", "Жёлтый"]', 'Синий', 'general'),
('Столица Франции?', '["Париж", "Берлин", "Лондон", "Мадрид"]', 'Париж', 'general'),
('Сколько планет в Солнечной системе?', '["7", "8", "9", "10"]', '8', 'science'),
('Какой год основания Москвы?', '["1147", "1240", "1380", "1480"]', '1147', 'history'),
('Столица России?', '["Санкт-Петербург", "Москва", "Новосибирск", "Екатеринбург"]', 'Москва', 'geography'),
('Кто написал "Войну и мир"?', '["Пушкин", "Толстой", "Достоевский", "Чехов"]', 'Толстой', 'literature'),
('Сколько дней в високосном году?', '["365", "366", "364", "367"]', '366', 'general'),
('Какой химический элемент обозначается как Fe?', '["Фтор", "Железо", "Фосфор", "Франций"]', 'Железо', 'science'),
('В каком году началась Вторая мировая война?', '["1939", "1940", "1941", "1942"]', '1939', 'history'),
('Самая длинная река в мире?', '["Нил", "Амазонка", "Янцзы", "Миссисипи"]', 'Нил', 'geography'),
('Кто изобрел телефон?', '["Эдисон", "Белл", "Тесла", "Маркони"]', 'Белл', 'science'),
('Столица Японии?', '["Токио", "Осака", "Киото", "Йокогама"]', 'Токио', 'geography'),
('Какой язык программирования создал Брендан Эйх?', '["Python", "Java", "JavaScript", "C++"]', 'JavaScript', 'technology'),
('В каком году была основана компания Apple?', '["1975", "1976", "1977", "1978"]', '1976', 'technology'),
('Кто написал "Гарри Поттера"?', '["Толкин", "Роулинг", "Льюис", "Даль"]', 'Роулинг', 'literature');

-- Вставляем 30 вопросов по CS2
INSERT INTO quiz_questions (text, answers, correct_answer, category) VALUES
('Какое оружие позволяет бегать быстрее всех?', '["SSG 08", "P250", "FAMAS", "Нож"]', 'Нож', 'cs2'),
('Какой максимальный запас здоровья у игрока?', '["100", "120", "150", "200"]', '100', 'cs2'),
('Какой пистолет доступен только террористам?', '["USP-S", "Glock-18", "Five-Seven", "P2000"]', 'Glock-18', 'cs2'),
('Какой автоматический дробовик есть в игре?', '["Nova", "MAG-7", "XM1014", "Sawed-Off"]', 'XM1014', 'cs2'),
('Какой скин считается самым дорогим в CS2?', '["AWP | Dragon Lore", "AK-47 | Redline", "M4A4 | Howl", "AK-47 | Case Hardened (Blue Gem)"]', 'AK-47 | Case Hardened (Blue Gem)', 'cs2'),
('Какой режим игры самый популярный?', '["Обычный", "Соревновательный", "Бой насмерть", "Гонка вооружений"]', 'Соревновательный', 'cs2'),
('Какой гранатой можно ослепить противника?', '["Осколочная", "Светошумовая", "Дымовая", "Зажигательная"]', 'Светошумовая', 'cs2'),
('Какой нож был добавлен одним из последних?', '["Керамбит", "Наваха", "Бабочка", "Фальшион"]', 'Наваха', 'cs2'),
('Какой урон наносит AWP в тело без брони?', '["50", "80", "115", "150"]', '115', 'cs2'),
('Какой из этих автоматов дешевле всего?', '["AK-47", "Galil AR", "FAMAS", "M4A1-S"]', 'Galil AR', 'cs2'),
('Какой максимальный запас денег у игрока?', '["10000", "12000", "16000", "20000"]', '16000', 'cs2'),
('Какой пистолет можно купить обеим сторонам?', '["Desert Eagle", "Dual Berettas", "Tec-9", "CZ75-Auto"]', 'Desert Eagle', 'cs2'),
('Какой скин был эксклюзивом для операции "Hydra"?', '["M4A4 | Hellfire", "AWP | Asiimov", "AK-47 | Neon Rider", "USP-S | Cortex"]', 'M4A4 | Hellfire', 'cs2'),
('Какой из этих карт нет в соревновательном пуле?', '["Mirage", "Inferno", "Italy", "Nuke"]', 'Italy', 'cs2'),
('Какой урон наносит HE-граната при прямом попадании?', '["50", "57", "80", "100"]', '57', 'cs2'),
('Какой SMG самый дешевый?', '["MP7", "MAC-10", "UMP-45", "MP9"]', 'MAC-10', 'cs2'),
('Какой снайперский прицел увеличивает в 2 раза?', '["SSG 08", "SCAR-20", "AWP", "G3SG1"]', 'SCAR-20', 'cs2'),
('Какой нож был первым добавлен в кейсы?', '["Керамбит", "Бабочка", "Фальшион", "Штык-нож"]', 'Керамбит', 'cs2'),
('Какой урон у USP-S в голову без брони?', '["100", "140", "200", "80"]', '140', 'cs2'),
('Какой дробовик используют только спецназ?', '["Nova", "MAG-7", "XM1014", "Sawed-Off"]', 'MAG-7', 'cs2'),
('Какой автоматический пистолет есть у террористов?', '["Five-Seven", "Tec-9", "CZ75-Auto", "P250"]', 'Tec-9', 'cs2'),
('Какой скин был самым дорогим на старте CS2?', '["AWP | Dragon Lore", "AK-47 | Case Hardened (Blue Gem)", "M4A4 | Howl", "AWP | Medusa"]', 'AK-47 | Case Hardened (Blue Gem)', 'cs2'),
('Какой урон у ножа в спину?', '["100", "150", "195", "250"]', '195', 'cs2'),
('Какой SMG популярен у спецназа?', '["MP9", "MAC-10", "UMP-45", "MP7"]', 'MP9', 'cs2'),
('Какой пистолет имеет наибольшую скорострельность?', '["CZ75-Auto", "Desert Eagle", "P250", "Five-Seven"]', 'CZ75-Auto', 'cs2'),
('Какой автоматический дробовик есть у обеих сторон?', '["Nova", "MAG-7", "XM1014", "Sawed-Off"]', 'XM1014', 'cs2'),
('Какой скин был эксклюзивом для коллекции "Cobblestone"?', '["AWP | Dragon Lore", "M4A4 | Griffin", "AK-47 | Emerald Pinstripe", "USP-S | Royal Blue"]', 'AWP | Dragon Lore', 'cs2'),
('Какой урон у AWP в голову?', '["200", "459", "300", "150"]', '459', 'cs2'),
('Какой SMG популярен у террористов?', '["MP9", "MAC-10", "UMP-45", "MP7"]', 'MAC-10', 'cs2'),
('Какой кейс был первым в CS2?', '["Revolution Case", "Prisma Case", "Clutch Case", "Snakebite Case"]', 'Revolution Case', 'cs2');

-- Обновляем существующие вопросы, добавляя категории если их нет
UPDATE quiz_questions 
SET category = 'general' 
WHERE category IS NULL;

UPDATE quiz_questions 
SET difficulty = 1 
WHERE difficulty IS NULL;

-- Создаем триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_quiz_progress_updated_at
  BEFORE UPDATE ON user_quiz_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 