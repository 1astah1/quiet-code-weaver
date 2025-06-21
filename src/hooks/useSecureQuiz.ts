
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityRateLimiter, auditLog } from "@/utils/security";
import { isValidUUID } from "@/utils/uuid";

interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  timeSpent: number;
}

export const useSecureQuiz = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const submitAnswer = useMutation({
    mutationFn: async ({ 
      userId, 
      answer 
    }: { 
      userId: string; 
      answer: QuizAnswer;
    }) => {
      // Rate limiting для викторины
      if (!SecurityRateLimiter.canPerformAction(userId, 'quiz_answer')) {
        throw new Error('Слишком быстрые ответы на вопросы викторины');
      }

      if (!isValidUUID(userId) || !isValidUUID(answer.questionId)) {
        await auditLog(userId, 'quiz_invalid_params', answer, false);
        throw new Error('Неверные параметры викторины');
      }

      // Проверка времени ответа (защита от ботов)
      if (answer.timeSpent < 1000) { // Меньше 1 секунды подозрительно
        await auditLog(userId, 'quiz_suspicious_timing', { 
          questionId: answer.questionId, 
          timeSpent: answer.timeSpent 
        }, false);
        throw new Error('Подозрительно быстрый ответ');
      }

      try {
        const isCorrect = answer.selectedAnswer === answer.correctAnswer;
        
        // Логируем ответ
        await auditLog(userId, 'quiz_answer_submitted', {
          questionId: answer.questionId,
          isCorrect,
          timeSpent: answer.timeSpent
        });

        // Обновляем прогресс пользователя
        const { error } = await supabase.rpc('update_quiz_progress', {
          p_user_id: userId,
          p_is_correct: isCorrect,
          p_time_spent: answer.timeSpent
        });

        if (error) {
          await auditLog(userId, 'quiz_progress_update_failed', { error: error.message }, false);
          throw error;
        }

        return { isCorrect, timeSpent: answer.timeSpent };
      } catch (error) {
        console.error('Quiz answer submission error:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-progress', variables.userId] });
      
      if (data.isCorrect) {
        toast({
          title: "Правильно!",
          description: "Вы ответили правильно",
        });
      } else {
        toast({
          title: "Неправильно",
          description: "Попробуйте еще раз",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка викторины",
        description: error.message || "Не удалось отправить ответ",
        variant: "destructive",
      });
    }
  });

  const restoreLives = useMutation({
    mutationFn: async (userId: string) => {
      if (!SecurityRateLimiter.canPerformAction(userId, 'restore_lives')) {
        throw new Error('Слишком частые попытки восстановления жизней');
      }

      try {
        // Проверяем временные ограничения через базу данных
        const { data: canRestore, error: checkError } = await supabase.rpc('check_time_limit', {
          p_user_id: userId,
          p_action_type: 'life_restore',
          p_interval_minutes: 120
        });

        if (checkError) {
          throw checkError;
        }

        if (!canRestore) {
          throw new Error('Жизни можно восстанавливать только раз в 2 часа');
        }

        const { error } = await supabase
          .from('users')
          .update({ 
            quiz_lives: 5,
            last_life_restore: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) {
          await auditLog(userId, 'life_restore_failed', { error: error.message }, false);
          throw error;
        }

        await auditLog(userId, 'life_restore_success', {});
        return { lives: 5 };
      } catch (error) {
        console.error('Life restoration error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Жизни восстановлены!",
        description: "Вы получили 5 жизней",
      });
    }
  });

  return {
    submitAnswer,
    restoreLives
  };
};
