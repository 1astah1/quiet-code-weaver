import { useState, useEffect, useCallback, useRef } from 'react';
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

export interface QuizProgress {
  hearts: number;
  last_heart_restore: string;
  last_ad_watch: string | null;
  questions_answered: number;
  correct_answers: number;
  current_streak: number;
  total_rewards_earned: number;
}

export interface QuizAnswer {
  is_correct: boolean;
  reward_amount: number;
  reward_type: string;
  hearts: number;
  can_watch_ad: boolean;
  questions_answered: number;
  correct_answers: number;
}

export interface QuizReward {
  type: 'coins' | 'gift';
  amount: number;
  milestone: number;
}

function loadQuizStateFromStorage() {
  try {
    const data = localStorage.getItem('quizState');
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function saveQuizStateToStorage(state: any) {
  try {
    localStorage.setItem('quizState', JSON.stringify(state));
  } catch {}
}

export function useQuiz() {
  const [hearts, setHearts] = useState(2);
  const [lastHeartRestore, setLastHeartRestore] = useState<Date>(new Date());
  const [lastAdWatch, setLastAdWatch] = useState<Date | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [canAnswer, setCanAnswer] = useState(true);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [timeUntilNextHeart, setTimeUntilNextHeart] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [reward, setReward] = useState<QuizReward | null>(null);

  // Получение текущего пользователя
  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }
    
    // Получаем ID пользователя из таблицы users
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

  // Загрузка прогресса пользователя
  const loadUserProgress = useCallback(async () => {
    try {
      const userId = await getCurrentUser();
      
      const { data: progress, error } = await supabase
        .from('user_quiz_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Ошибка загрузки прогресса:', error);
        return;
      }
      
      if (progress) {
        setHearts(progress.hearts);
        setLastHeartRestore(new Date(progress.last_heart_restore));
        setLastAdWatch(progress.last_ad_watch ? new Date(progress.last_ad_watch) : null);
        setQuestionsAnswered(progress.questions_answered);
        setCorrectAnswers(progress.correct_answers);
        setCanAnswer(progress.hearts > 0);
        setIsRestoreModalOpen(progress.hearts === 0);
      }
    } catch (error) {
      console.error('Ошибка загрузки прогресса:', error);
    }
  }, [getCurrentUser]);

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
        return {
          id: question.id,
          question: question.text,
          options: question.answers,
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
        await loadUserProgress();
        const question = await fetchRandomQuestion();
        if (question) {
          setCurrentQuestion(question);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };
    
    initQuiz();
  }, [loadUserProgress, fetchRandomQuestion]);

  // Таймер восстановления сердец
  useEffect(() => {
    if (hearts > 0) return;
    
    const interval = setInterval(async () => {
      try {
        const userId = await getCurrentUser();
        
        const { data, error } = await supabase
          .rpc('auto_restore_heart', { user_id_param: userId });
        
        if (error) {
          console.error('Ошибка проверки восстановления:', error);
          return;
        }
        
        if (data.success) {
          setHearts(data.hearts);
          setCanAnswer(true);
          setIsRestoreModalOpen(false);
          await loadUserProgress();
        } else {
          const timeRemaining = data.time_remaining || 0;
          setTimeUntilNextHeart(timeRemaining);
        }
      } catch (error) {
        console.error('Ошибка таймера восстановления:', error);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [hearts, getCurrentUser, loadUserProgress]);

  // Ответ на вопрос
  const answerQuestion = useCallback(async (answer: string): Promise<boolean> => {
    if (!currentQuestion || !canAnswer || hearts === 0) return false;
    
    try {
      setLoading(true);
      const userId = await getCurrentUser();
      
      const { data, error } = await supabase
        .rpc('process_quiz_answer', {
          user_id_param: userId,
          question_id_param: currentQuestion.id,
          answer_param: answer
        });
      
      if (error) {
        console.error('Ошибка обработки ответа:', error);
        return false;
      }
      
      if (data) {
        const isCorrect = data.is_correct;
        setHearts(data.hearts);
        setQuestionsAnswered(data.questions_answered);
        setCorrectAnswers(data.correct_answers);
        setCanAnswer(data.hearts > 0);
        
        // Проверяем награды
        if (data.reward_amount > 0) {
          const milestone = data.correct_answers;
          const rewardType = milestone === 30 ? 'gift' : 'coins';
          setReward({
            type: rewardType,
            amount: data.reward_amount,
            milestone
          });
        }
        
        // Загружаем следующий вопрос
        const nextQuestion = await fetchRandomQuestion();
        if (nextQuestion) {
          setCurrentQuestion(nextQuestion);
        }
        
        return isCorrect;
      }
      
      return false;
    } catch (error) {
      console.error('Ошибка ответа на вопрос:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentQuestion, canAnswer, hearts, getCurrentUser, fetchRandomQuestion]);

  // Восстановление сердца
  const restoreHeart = useCallback(async () => {
    try {
      const userId = await getCurrentUser();
      
      const { data, error } = await supabase
        .rpc('restore_heart_with_ad', { user_id_param: userId });
      
      if (error) {
        console.error('Ошибка восстановления сердца:', error);
        return;
      }
      
      if (data.success) {
        setHearts(data.hearts);
        setCanAnswer(true);
        setIsRestoreModalOpen(false);
        await loadUserProgress();
      }
    } catch (error) {
      console.error('Ошибка восстановления сердца:', error);
    }
  }, [getCurrentUser, loadUserProgress]);

  // Проверка возможности восстановления рекламой
  const canRestoreWithAd = useCallback(() => {
    if (!lastAdWatch) return true;
    
    const timeSinceLastAd = Date.now() - lastAdWatch.getTime();
    const eightHours = 8 * 60 * 60 * 1000;
    
    return timeSinceLastAd >= eightHours;
  }, [lastAdWatch]);

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
    canRestoreWithAd: canRestoreWithAd(),
    reward,
    clearReward
  };
}

export function useSecureQuiz() {
  const quiz = useQuiz();

  const safeAnswerQuestion = async (answer: string) => {
    try {
      return await quiz.answerQuestion(answer);
    } catch (error) {
      console.error('Ошибка безопасного ответа:', error);
      return false;
    }
  };

  const safeRestoreHeart = async () => {
    try {
      await quiz.restoreHeart();
    } catch (error) {
      console.error('Ошибка безопасного восстановления:', error);
    }
  };

  return {
    ...quiz,
    answerQuestion: safeAnswerQuestion,
    restoreHeart: safeRestoreHeart
  };
} 