
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecureQuiz = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkQuizAvailability = async (userId: string): Promise<{ canTakeQuiz: boolean; nextAvailable?: Date; reason?: string }> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if user took quiz today
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('last_quiz_date')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user quiz data:', userError);
        setError('Failed to check quiz availability');
        return { canTakeQuiz: false, reason: 'Database error' };
      }

      if (!user.last_quiz_date) {
        return { canTakeQuiz: true };
      }

      const lastQuizDate = new Date(user.last_quiz_date);
      const now = new Date();
      const timeDiff = now.getTime() - lastQuizDate.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      // Allow quiz if more than 24 hours have passed
      if (hoursDiff >= 24) {
        return { canTakeQuiz: true };
      } else {
        const nextAvailable = new Date(lastQuizDate.getTime() + (24 * 60 * 60 * 1000));
        return { 
          canTakeQuiz: false, 
          nextAvailable,
          reason: '24h_cooldown'
        };
      }
      
    } catch (err) {
      console.error('Error checking quiz availability:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { canTakeQuiz: false, reason: 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuizProgress = async (userId: string, correctAnswers: number, totalQuestions: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      // Update user_quiz_progress
      const { error: progressError } = await supabase
        .from('user_quiz_progress')
        .upsert({
          user_id: userId,
          correct_answers: correctAnswers,
          questions_answered: totalQuestions,
          completed: true,
          date: today
        });

      if (progressError) {
        console.error('Error updating quiz progress:', progressError);
        throw progressError;
      }

      // Update user's last_quiz_date
      const { error: userError } = await supabase
        .from('users')
        .update({ last_quiz_date: today })
        .eq('id', userId);

      if (userError) {
        console.error('Error updating user quiz date:', userError);
        throw userError;
      }

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
    checkQuizAvailability,
    updateQuizProgress,
    isLoading,
    error
  };
};
