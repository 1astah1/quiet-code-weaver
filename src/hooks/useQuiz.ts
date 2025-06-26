
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { QuizQuestion } from '../components/quiz/QuizQuestionCard';
import { toast } from 'sonner';
import React from 'react';

// Type for the entire quiz state, based on the `get_quiz_state` RPC function
export interface QuizState {
  lives: number;
  ad_cooldown_seconds: number;
  streak_multiplier: number;
  reward: number;
  current_question: QuizQuestion | null;
  quiz_progress: {
    current: number;
    total: number;
  };
}

// 1. Function to fetch the quiz state
const fetchQuizState = async (): Promise<QuizState> => {
  console.log('🎯 [QUIZ] Fetching quiz state...');
  
  const { data, error } = await supabase.rpc('get_quiz_state');
  
  if (error) {
    console.error('❌ [QUIZ] Error fetching quiz state:', error);
    throw new Error(error.message);
  }

  console.log('✅ [QUIZ] Raw data from get_quiz_state:', data);

  // If there's no data, it means the quiz is over or not started.
  // Return a default state to prevent errors.
  if (!data || data.length === 0) {
    console.log('⚠️ [QUIZ] No data returned, using default state');
    return {
      lives: 2,
      ad_cooldown_seconds: 0,
      streak_multiplier: 1.0,
      reward: 100,
      current_question: null,
      quiz_progress: { current: 0, total: 0 },
    };
  }

  // The RPC returns an array with a single object, we need to extract it.
  const result = data[0] as QuizState;
  console.log('✅ [QUIZ] Processed quiz state:', result);
  
  return result;
};

// 2. Function to answer a question
const answerQuestion = async (answerId: string) => {
  console.log('🎯 [QUIZ] Answering question with ID:', answerId);
  
  const { data, error } = await supabase.rpc('answer_quiz_question', { p_answer_id: answerId });

  if (error) {
    console.error('❌ [QUIZ] Error answering question:', error);
    throw new Error(error.message);
  }
  
  const result = data[0];
  console.log('✅ [QUIZ] Answer result:', result);
  
  if (!result.success) {
    throw new Error(result.message || 'Произошла неизвестная ошибка');
  }

  toast.success(result.message);
  
  if (result.correct && result.new_balance) {
    toast.success(`+${result.reward || 100} 💰 на ваш баланс!`);
  } else if (!result.correct) {
      toast.error('Неверный ответ! Вы потеряли одну жизнь.');
  }

  return result;
};

// 3. Function to get a life for an ad
const getLifeForAd = async () => {
    console.log('🎯 [QUIZ] Getting life for ad...');
    
    const { data, error } = await supabase.rpc('get_life_for_ad');

    if (error) {
        console.error('❌ [QUIZ] Error getting life for ad:', error);
        throw new Error(error.message);
    }

    const result = data[0];
    console.log('✅ [QUIZ] Ad life result:', result);
    
    if (result.success) {
        toast.success(result.message);
    } else {
        toast.error(result.message);
    }
    return result;
}

// The main hook that will be used in the component
export function useQuiz() {
  const queryClient = useQueryClient();

  // Query for fetching the quiz state
  const { 
    data: quizState, 
    isLoading: loading, 
    error,
    isError 
  } = useQuery<QuizState>({
    queryKey: ['quizState'],
    queryFn: fetchQuizState,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });

  // Mutation for answering a question
  const { mutate: submitAnswer, isPending: isAnswering } = useMutation({
    mutationFn: answerQuestion,
    onSuccess: () => {
      console.log('✅ [QUIZ] Answer submitted successfully, invalidating queries');
      // When an answer is successfully submitted, refetch the quiz state
      // to get the next question and updated user profile.
      queryClient.invalidateQueries({ queryKey: ['quizState'] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // Also refetch user balance
    },
    onError: (e) => {
        console.error('❌ [QUIZ] Error submitting answer:', e);
        toast.error(e.message);
    }
  });

  // Mutation for watching an ad
  const { mutate: watchAd, isPending: isWatchingAd } = useMutation({
      mutationFn: getLifeForAd,
      onSuccess: () => {
          console.log('✅ [QUIZ] Ad watched successfully, invalidating queries');
          queryClient.invalidateQueries({ queryKey: ['quizState'] });
      },
      onError: (e) => {
          console.error('❌ [QUIZ] Error watching ad:', e);
          toast.error(e.message);
      }
  });

  // Safe state calculations with fallbacks
  const lives = quizState?.lives ?? 2;
  const currentQuestion = quizState?.current_question ?? null;
  const quizProgress = quizState?.quiz_progress ?? { current: 0, total: 0 };
  const adCooldownSeconds = quizState?.ad_cooldown_seconds ?? 0;
  
  const canAnswer = lives > 0 && !!currentQuestion && !isAnswering;
  const isRestoreModalOpen = lives === 0 && !loading;
  
  const [restoreTimeLeft, setRestoreTimeLeft] = React.useState(adCooldownSeconds);

  React.useEffect(() => {
    if (isRestoreModalOpen && adCooldownSeconds > 0) {
      console.log('⏰ [QUIZ] Starting restore countdown:', adCooldownSeconds);
      setRestoreTimeLeft(adCooldownSeconds);
      
      const interval = setInterval(() => {
        setRestoreTimeLeft(prev => {
          if (prev <= 1) {
            console.log('⏰ [QUIZ] Countdown finished, refreshing quiz state');
            clearInterval(interval);
            queryClient.invalidateQueries({ queryKey: ['quizState'] });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        console.log('⏰ [QUIZ] Cleaning up countdown interval');
        clearInterval(interval);
      };
    }
  }, [isRestoreModalOpen, adCooldownSeconds, queryClient]);

  // Error message handling
  const errorMessage = isError ? (error?.message || 'Ошибка загрузки викторины') : undefined;

  console.log('[QUIZ DEBUG] State:', {
    lives,
    currentQuestion: currentQuestion?.id || null,
    quizProgress,
    loading,
    errorMessage,
    canAnswer,
    isRestoreModalOpen
  });

  return {
    // State
    hearts: lives,
    currentQuestion,
    quizProgress,
    streak: quizState?.streak_multiplier ?? 1.0,
    reward: quizState?.reward ?? 100,
    
    // Status
    loading: loading || isAnswering,
    isRestoreModalOpen,
    canAnswer,
    errorMessage,
    restoreTimeLeft,

    // Actions
    handleAnswer: submitAnswer,
    handleWatchAd: watchAd,
    closeRestoreModal: () => {
      console.log('🔄 [QUIZ] Closing restore modal by refreshing state');
      queryClient.invalidateQueries({ queryKey: ['quizState'] });
    },
    resetQuiz: () => {
        console.log('🔄 [QUIZ] Resetting quiz state');
        queryClient.invalidateQueries({ queryKey: ['quizState'] });
        toast.info("Состояние викторины обновлено с сервера.");
    }
  };
}

export function useSecureQuiz() {
  const quiz = useQuiz();
  const lastActionRef = React.useRef<number>(0);

  // Защита от спама и двойных кликов
  const safeHandleAnswer = React.useCallback(async (answer: string) => {
    const now = Date.now();
    if (now - lastActionRef.current < 1000) {
      console.log('⚠️ [QUIZ] Rate limit: ignoring rapid click');
      return;
    }
    lastActionRef.current = now;
    
    console.log('🎯 [QUIZ] Safe answer submission:', answer);
    quiz.handleAnswer(answer);
  }, [quiz.handleAnswer]);

  const safeHandleWatchAd = React.useCallback(async () => {
    const now = Date.now();
    if (now - lastActionRef.current < 1000) {
      console.log('⚠️ [QUIZ] Rate limit: ignoring rapid ad click');
      return;
    }
    lastActionRef.current = now;
    
    console.log('🎯 [QUIZ] Safe ad watch');
    quiz.handleWatchAd();
  }, [quiz.handleWatchAd]);

  return {
    ...quiz,
    handleAnswer: safeHandleAnswer,
    handleWatchAd: safeHandleWatchAd,
  };
}
