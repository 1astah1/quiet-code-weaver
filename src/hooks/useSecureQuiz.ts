
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecureQuiz = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkTimeLimit = async (userId: string, lastQuizDate: string | null): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simple time check logic
      if (!lastQuizDate) return true;
      
      const lastQuiz = new Date(lastQuizDate);
      const now = new Date();
      const timeDiff = now.getTime() - lastQuiz.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      // Allow quiz if more than 24 hours have passed
      return hoursDiff >= 24;
      
    } catch (err) {
      console.error('Error checking time limit:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuizProgress = async (userId: string, correctAnswers: number, totalQuestions: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('user_quiz_progress')
        .upsert({
          user_id: userId,
          correct_answers: correctAnswers,
          questions_answered: totalQuestions,
          completed: true,
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error updating quiz progress:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkTimeLimit,
    updateQuizProgress,
    isLoading,
    error
  };
};
