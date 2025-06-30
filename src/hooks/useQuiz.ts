import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import { type User } from '@supabase/supabase-js';

// Types to match the data from the server
export interface QuizQuestion {
  id: string;
  text: string;
  answers: string[];
  image_url?: string;
}

export interface UserQuizProgress {
  id: string;
  user_id: string;
  hearts: number;
  last_heart_restore: string;
  questions_answered: number;
  correct_answers: number;
  current_streak: number;
  total_rewards_earned: number;
  created_at: string;
  updated_at: string;
}

export interface QuizState {
  progress: UserQuizProgress | null;
  question: QuizQuestion | null;
  next_heart_restores_in_seconds: number | null;
}

export function useQuiz() {
  const [user, setUser] = useState<User | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeUntilNextHeart, setTimeUntilNextHeart] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const fetchQuizState = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_user_quiz_state');

      if (rpcError) {
        throw rpcError;
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      setQuizState(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить состояние викторины');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchQuizState();
    }
  }, [user]);

  useEffect(() => {
    if (quizState?.next_heart_restores_in_seconds) {
      setTimeUntilNextHeart(quizState.next_heart_restores_in_seconds);
    } else {
      setTimeUntilNextHeart(null);
    }

    const timer = setInterval(() => {
      setTimeUntilNextHeart((prevTime: number | null) => {
        if (prevTime === null || prevTime <= 1) {
          // Time to refetch the state from server as a heart should be restored
          if (user) fetchQuizState();
          return null;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState?.next_heart_restores_in_seconds, user]);


  const answerQuestion = useCallback(async (questionId: string, answer: string): Promise<boolean> => {
    if (submitting || !user) return false;

    setSubmitting(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('answer_quiz_question', {
        p_question_id: questionId,
        p_user_answer: answer
      });

      if (rpcError) throw rpcError;
      if (data.error) throw new Error(data.error);

      // We need to find out if the answer was correct.
      // The old state has the question, the new state has updated progress.
      const oldCorrectAnswers = quizState?.progress?.correct_answers ?? 0;
      const newCorrectAnswers = data.progress.correct_answers;

      setQuizState(data);
      return newCorrectAnswers > oldCorrectAnswers;
    } catch (err: any) {
      setError(err.message || 'Ошибка при ответе на вопрос');
      console.error(err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [submitting, user, quizState]);

  const maxHearts = 2;

  return useMemo(() => ({
    question: quizState?.question,
    progress: quizState?.progress,
    hearts: quizState?.progress?.hearts ?? 0,
    maxHearts,
    correctAnswers: quizState?.progress?.correct_answers ?? 0,
    timeUntilNextHeart,
    loading,
    error,
    submitting,
    answerQuestion,
    refreshState: fetchQuizState,
  }), [quizState, timeUntilNextHeart, loading, error, submitting, answerQuestion, fetchQuizState]);
}
