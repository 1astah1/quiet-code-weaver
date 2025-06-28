import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface QuizQuestion {
  id: string;
  text: string;
  answers: string[];
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
  const [restoreTimeLeft, setRestoreTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showReward, setShowReward] = useState<{ amount: number; type: string } | null>(null);
  const [progressBar, setProgressBar] = useState(0);

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
          text: question.text,
          answers: question.answers,
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
      await loadUserProgress();
      const question = await fetchRandomQuestion();
      if (question) {
        setCurrentQuestion(question);
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
          setRestoreTimeLeft(timeRemaining);
        }
      } catch (error) {
        console.error('Ошибка таймера восстановления:', error);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [hearts, getCurrentUser, loadUserProgress]);

  // Обновление полосы прогресса
  useEffect(() => {
    const progress = (questionsAnswered % 10) / 10 * 100;
    setProgressBar(progress);
  }, [questionsAnswered]);

  // Ответ на вопрос
  const handleAnswer = useCallback(async (answer: string) => {
    if (!canAnswer || loading || !currentQuestion) return;
    
    setLoading(true);
    setErrorMessage(null);
    setShowReward(null);
    
    try {
      const userId = await getCurrentUser();
      
      const { data, error } = await supabase
        .rpc('process_quiz_answer', {
          user_id_param: userId,
          question_id_param: currentQuestion.id,
          user_answer_param: answer
        });
      
      if (error) {
        console.error('Ошибка обработки ответа:', error);
        setErrorMessage('Ошибка обработки ответа');
        setLoading(false);
        return;
      }
      
      const result: QuizAnswer = data;
      
      // Обновляем состояние
      setHearts(result.hearts);
      setQuestionsAnswered(result.questions_answered);
      setCorrectAnswers(result.correct_answers);
      setCanAnswer(result.hearts > 0);
      
      if (result.is_correct) {
        // Показываем награду если есть
        if (result.reward_amount > 0) {
          setShowReward({
            amount: result.reward_amount,
            type: result.reward_type
          });
        }
        
        // Получаем следующий вопрос
        const nextQuestion = await fetchRandomQuestion();
        if (nextQuestion) {
          setCurrentQuestion(nextQuestion);
        }
      } else {
        setErrorMessage('Неправильный ответ!');
        
        if (result.hearts <= 0) {
          setIsRestoreModalOpen(true);
        }
      }
      
      // Обновляем прогресс
      await loadUserProgress();
      
    } catch (error) {
      console.error('Ошибка ответа:', error);
      setErrorMessage('Ошибка обработки ответа');
    } finally {
      setLoading(false);
    }
  }, [canAnswer, loading, currentQuestion, getCurrentUser, fetchRandomQuestion, loadUserProgress]);

  // Просмотр рекламы для восстановления сердца
  const handleWatchAd = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const userId = await getCurrentUser();
      
      const { data, error } = await supabase
        .rpc('restore_heart_by_ad', { user_id_param: userId });
      
      if (error) {
        console.error('Ошибка восстановления сердца:', error);
        setErrorMessage('Ошибка восстановления сердца');
        setLoading(false);
        return;
      }
      
      if (data.success) {
        setHearts(data.hearts);
        setCanAnswer(true);
        setIsRestoreModalOpen(false);
        await loadUserProgress();
      } else {
        setErrorMessage('Нельзя смотреть рекламу так часто');
      }
    } catch (error) {
      console.error('Ошибка просмотра рекламы:', error);
      setErrorMessage('Ошибка просмотра рекламы');
    } finally {
      setLoading(false);
    }
  }, [loading, getCurrentUser, loadUserProgress]);

  const closeRestoreModal = () => setIsRestoreModalOpen(false);

  const resetQuiz = async () => {
    try {
      const userId = await getCurrentUser();
      
      // Удаляем прогресс пользователя
      await supabase
        .from('user_quiz_progress')
        .delete()
        .eq('user_id', userId);
      
      // Удаляем ответы пользователя
      await supabase
        .from('user_quiz_answers')
        .delete()
        .eq('user_id', userId);
      
      // Сбрасываем состояние
      setHearts(2);
      setLastHeartRestore(new Date());
      setLastAdWatch(null);
      setCurrentQuestion(null);
      setCanAnswer(true);
      setIsRestoreModalOpen(false);
      setErrorMessage(null);
      setQuestionsAnswered(0);
      setCorrectAnswers(0);
      setShowReward(null);
      setProgressBar(0);
      
      // Получаем новый вопрос
      const question = await fetchRandomQuestion();
      if (question) {
        setCurrentQuestion(question);
      }
    } catch (error) {
      console.error('Ошибка сброса викторины:', error);
    }
  };

  return {
    hearts,
    isRestoreModalOpen,
    currentQuestion,
    canAnswer,
    handleAnswer,
    handleWatchAd,
    restoreTimeLeft,
    closeRestoreModal,
    loading,
    errorMessage,
    resetQuiz,
    questionsAnswered,
    correctAnswers,
    showReward,
    progressBar,
    setShowReward
  };
}

export function useSecureQuiz() {
  const quiz = useQuiz();
  const lastActionRef = useRef<number>(0);

  // Защита от спама и двойных кликов
  const safeHandleAnswer = async (answer: string) => {
    const now = Date.now();
    if (now - lastActionRef.current < 1000) return; // не чаще 1 раза в секунду
    lastActionRef.current = now;
    await quiz.handleAnswer(answer);
  };

  const safeHandleWatchAd = async () => {
    const now = Date.now();
    if (now - lastActionRef.current < 1000) return;
    lastActionRef.current = now;
    await quiz.handleWatchAd();
  };

  return {
    ...quiz,
    handleAnswer: safeHandleAnswer,
    handleWatchAd: safeHandleWatchAd,
  };
} 