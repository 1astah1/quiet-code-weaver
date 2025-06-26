import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { QuizQuestion } from '../components/quiz/QuizQuestionCard'; // Assuming type is exported from here
import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';

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
  const { data, error } = await supabase.rpc('get_quiz_state');
  
  if (error) {
    console.error('Error fetching quiz state:', error);
    throw new Error(error.message);
  }

  // If there's no data, it means the quiz is over or not started.
  // Return a default state to prevent errors.
  if (!data || data.length === 0) {
    return {
      lives: 0,
      ad_cooldown_seconds: 0,
      streak_multiplier: 1.0,
      reward: 0,
      current_question: null,
      quiz_progress: { current: 0, total: 0 },
    };
  }

  // The RPC returns an array with a single object, we need to extract it.
  return data[0] as QuizState;
};

// 2. Function to answer a question
const answerQuestion = async (answerId: string) => {
  const { data, error } = await supabase.rpc('answer_quiz_question', { p_answer_id: answerId });

  if (error) {
    console.error('Error answering question:', error);
    throw new Error(error.message);
  }
  
  const result = data[0];
  if (!result.success) {
    throw new Error(result.message || 'Произошла неизвестная ошибка');
  }

  toast.success(result.message);
  
  if (result.correct && result.new_balance) {
    toast.success(`+${result.new_balance - (result.new_balance - 100)} 💰 на ваш баланс!`);
  } else if (!result.correct) {
      toast.error('Неверный ответ! Вы потеряли одну жизнь.');
  }

  return result;
};

// 3. Function to get a life for an ad
const getLifeForAd = async () => {
    const { data, error } = await supabase.rpc('get_life_for_ad');

    if (error) {
        console.error('Error getting life for ad:', error);
        throw new Error(error.message);
    }

    const result = data[0];
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
  const { data: quizState, isLoading: loading, error } = useQuery<QuizState>({
    queryKey: ['quizState'],
    queryFn: fetchQuizState,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Mutation for answering a question
  const { mutate: submitAnswer, isPending: isAnswering } = useMutation({
    mutationFn: answerQuestion,
    onSuccess: () => {
      // When an answer is successfully submitted, refetch the quiz state
      // to get the next question and updated user profile.
      queryClient.invalidateQueries({ queryKey: ['quizState'] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // Also refetch user balance
    },
    onError: (e) => {
        toast.error(e.message);
    }
  });

  // Mutation for watching an ad
  const { mutate: watchAd, isPending: isWatchingAd } = useMutation({
      mutationFn: getLifeForAd,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['quizState'] });
      }
  })

  const canAnswer = quizState?.lives !== undefined && quizState.lives > 0 && !!quizState.current_question;
  const isRestoreModalOpen = quizState?.lives === 0;
  
  const [restoreTimeLeft, setRestoreTimeLeft] = React.useState(quizState?.ad_cooldown_seconds ?? 0);

  React.useEffect(() => {
    if (isRestoreModalOpen && quizState?.ad_cooldown_seconds) {
      setRestoreTimeLeft(quizState.ad_cooldown_seconds);
      const interval = setInterval(() => {
        setRestoreTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            queryClient.invalidateQueries({ queryKey: ['quizState'] });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRestoreModalOpen, quizState?.ad_cooldown_seconds, queryClient]);


  return {
    // State
    hearts: quizState?.lives ?? 0,
    currentQuestion: quizState?.current_question ?? null,
    quizProgress: quizState?.quiz_progress ?? { current: 0, total: 0 },
    streak: quizState?.streak_multiplier ?? 1.0,
    reward: quizState?.reward ?? 100,
    
    // Status
    loading: loading || isAnswering,
    isRestoreModalOpen,
    canAnswer,
    errorMessage: error?.message,
    restoreTimeLeft,

    // Actions
    handleAnswer: submitAnswer,
    handleWatchAd: watchAd,
    closeRestoreModal: () => {}, // The modal will close automatically on state change
    resetQuiz: () => { // For testing purposes
        // This is a bit tricky without a dedicated RPC call.
        // For now, let's just refetch. A proper reset would need a backend function.
        queryClient.invalidateQueries({ queryKey: ['quizState'] });
        toast.info("Состояние викторины обновлено с сервера.");
    }
  };
}

export function useSecureQuiz() {
  const quiz = useQuiz();
  const lastActionRef = React.useRef<number>(0);

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