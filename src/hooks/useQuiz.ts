
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  image_url?: string;
  difficulty: number;
  category: string;
}

export interface QuizReward {
  type: 'coins' | 'gift';
  amount: number;
  milestone: number;
}

export function useQuiz() {
  const [hearts, setHearts] = useState(2);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [reward, setReward] = useState<QuizReward | null>(null);
  const [timeUntilNextHeart, setTimeUntilNextHeart] = useState(0);

  // Получение текущего пользователя
  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();
    
    if (error || !userData) {
      throw new Error('Пользователь не найден');
    }
    
    return userData.id;
  }, []);

  // Получение случайного вопроса
  const fetchRandomQuestion = useCallback(async () => {
    try {
      const userId = await getCurrentUser();
      
      const { data, error } = await supabase
        .rpc('get_random_quiz_question', {
          user_id_param: userId,
          category_param: 'general'
        });
      
      if (error) {
        console.error('Ошибка получения вопроса:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const question = data[0];
        // Парсим answers из JSONB
        const answers = typeof question.answers === 'string' 
          ? JSON.parse(question.answers) 
          : question.answers;
        
        return {
          id: question.id,
          question: question.text,
          options: Array.isArray(answers) ? answers : [],
          correct_answer: question.correct_answer,
          image_url: question.image_url,
          difficulty: question.difficulty,
          category: question.category
        };
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка получения вопроса:', error);
      return null;
    }
  }, [getCurrentUser]);

  // Инициализация викторины
  useEffect(() => {
    const initQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const question = await fetchRandomQuestion();
        if (question) {
          setCurrentQuestion(question);
        } else {
          setError('Не удалось загрузить вопрос');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };
    
    initQuiz();
  }, [fetchRandomQuestion]);

  // Ответ на вопрос
  const answerQuestion = useCallback(async (answer: string): Promise<boolean> => {
    if (!currentQuestion || loading || hearts === 0) return false;
    
    try {
      setLoading(true);
      const isCorrect = answer === currentQuestion.correct_answer;
      
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
      } else {
        setHearts(prev => Math.max(0, prev - 1));
      }
      
      setQuestionsAnswered(prev => prev + 1);
      
      // Загружаем следующий вопрос через небольшую задержку
      setTimeout(async () => {
        const nextQuestion = await fetchRandomQuestion();
        if (nextQuestion) {
          setCurrentQuestion(nextQuestion);
        }
      }, 1500);
      
      return isCorrect;
    } catch (error) {
      console.error('Ошибка ответа на вопрос:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentQuestion, loading, hearts, fetchRandomQuestion]);

  // Восстановление сердца
  const restoreHeart = useCallback(async () => {
    setHearts(prev => Math.min(2, prev + 1));
  }, []);

  // Проверка возможности восстановления рекламой
  const canRestoreWithAd = true;

  // Очистка награды
  const clearReward = useCallback(() => {
    setReward(null);
  }, []);

  return {
    currentQuestion,
    questionsAnswered,
    correctAnswers,
    hearts,
    timeUntilNextHeart,
    loading,
    error,
    answerQuestion,
    restoreHeart,
    canRestoreWithAd,
    reward,
    clearReward
  };
}
