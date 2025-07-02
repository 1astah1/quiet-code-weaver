import { useEffect, useCallback, useMemo, useReducer } from 'react';
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
}

export interface ServerQuizState {
  progress: UserQuizProgress | null;
  question: QuizQuestion | null;
  next_heart_restores_in_seconds: number | null;
}

// Reducer Logic for State Management
type State = {
  loading: boolean;
  submitting: boolean;
  error: string | null;
  data: ServerQuizState | null;
  timeUntilNextHeart: number | null;
  user: User | null;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: ServerQuizState }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: ServerQuizState }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'TICK_TIMER' };

const initialState: State = {
  loading: true,
  submitting: false,
  error: null,
  data: null,
  timeUntilNextHeart: null,
  user: null,
};

function quizReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        data: action.payload,
        timeUntilNextHeart: action.payload.next_heart_restores_in_seconds,
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SUBMIT_START':
      return { ...state, submitting: true, error: null };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        submitting: false,
        data: action.payload,
        timeUntilNextHeart: action.payload.next_heart_restores_in_seconds,
      };
    case 'SUBMIT_ERROR':
      return { ...state, submitting: false, error: action.payload };
    case 'TICK_TIMER': {
      if (state.timeUntilNextHeart === null || state.timeUntilNextHeart <= 1) {
        return { ...state, timeUntilNextHeart: null };
      }
      return { ...state, timeUntilNextHeart: state.timeUntilNextHeart - 1 };
    }
    default:
      return state;
  }
}

export function useQuiz() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const { user } = state;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      dispatch({ type: 'SET_USER', payload: user });
    };
    fetchUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'SET_USER', payload: session?.user ?? null });
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchQuizState = useCallback(async () => {
    if (!user) return;
    dispatch({ type: 'FETCH_START' });
    try {
      const { data, error: rpcError } = await supabase.rpc('get_user_quiz_state');
      if (rpcError) throw rpcError;
      if (!data) throw new Error('No data received');
      if (typeof data === 'object' && data && 'error' in data) {
        throw new Error((data as any).error);
      }
      dispatch({ type: 'FETCH_SUCCESS', payload: data as unknown as ServerQuizState });
    } catch (err: any) {
      const message = err.message || 'Не удалось загрузить состояние викторины';
      dispatch({ type: 'FETCH_ERROR', payload: message });
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchQuizState();
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      if(state.timeUntilNextHeart !== null) {
        dispatch({ type: 'TICK_TIMER' });
        // Refetch when timer hits zero to update hearts on server
        if (state.timeUntilNextHeart <= 1) {
          fetchQuizState();
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [state.timeUntilNextHeart, fetchQuizState]);

  const answerQuestion = useCallback(async (questionId: string, answer: string): Promise<boolean> => {
    if (state.submitting || !user) return false;

    dispatch({ type: 'SUBMIT_START' });
    try {
      const oldCorrectAnswers = state.data?.progress?.correct_answers ?? 0;
      
      const { data, error: rpcError } = await supabase.rpc('answer_quiz_question', {
        p_question_id: questionId,
        p_user_answer: answer,
      });

      if (rpcError) throw rpcError;
      if (!data) throw new Error('No data received');
      
      // The RPC returns a different format than expected, let's handle it
      const isCorrect = Array.isArray(data) && data.length > 0 && data[0]?.correct === true;
      
      // Refetch the quiz state to get updated data
      await fetchQuizState();
      
      return isCorrect;
    } catch (err: any) {
      const message = err.message || 'Ошибка при ответе на вопрос';
      dispatch({ type: 'SUBMIT_ERROR', payload: message });
      console.error(err);
      return false;
    }
  }, [user, state.submitting, state.data?.progress?.correct_answers]);

  return useMemo(() => ({
    loading: state.loading,
    submitting: state.submitting,
    error: state.error,
    question: state.data?.question,
    progress: state.data?.progress,
    hearts: state.data?.progress?.hearts ?? 0,
    maxHearts: 2,
    timeUntilNextHeart: state.timeUntilNextHeart,
    answerQuestion,
    refreshState: fetchQuizState,
  }), [state, answerQuestion, fetchQuizState]);
}
