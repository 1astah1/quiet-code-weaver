
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityRateLimiter, auditLog } from "@/utils/security";
import { isValidUUID } from "@/utils/uuid";

interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  category: string;
  image_url?: string;
}

interface QuizProgress {
  id: string;
  questions_answered: number;
  correct_answers: number;
  completed: boolean;
}

export const useSecureQuiz = (userId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['quiz-questions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('is_active', true)
          .limit(10);

        if (error) {
          console.error('Error loading quiz questions:', error);
          throw error;
        }

        return (data || []) as QuizQuestion[];
      } catch (error) {
        console.error('Quiz questions query error:', error);
        return [];
      }
    },
    retry: 2,
    staleTime: 300000 // 5 минут
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['quiz-progress', userId],
    queryFn: async () => {
      if (!isValidUUID(userId)) {
        console.error('Invalid user ID format:', userId);
        return null;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('user_quiz_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading quiz progress:', error);
          return null;
        }

        return data as QuizProgress | null;
      } catch (error) {
        console.error('Quiz progress query error:', error);
        return null;
      }
    },
    enabled: !!userId && isValidUUID(userId),
    retry: 2
  });

  const answerQuestion = useMutation({
    mutationFn: async ({ 
      questionId, 
      selectedAnswer, 
      isCorrect 
    }: { 
      questionId: string; 
      selectedAnswer: string; 
      isCorrect: boolean;
    }) => {
      if (!SecurityRateLimiter.canPerformAction(userId, 'quiz_answer')) {
        const remaining = SecurityRateLimiter.getRemainingTime(userId, 'quiz_answer');
        throw new Error(`Слишком быстрые ответы. Попробуйте через ${Math.ceil(remaining / 1000)} секунд`);
      }

      if (!isValidUUID(userId) || !isValidUUID(questionId)) {
        await auditLog(userId, 'quiz_answer_invalid_params', { questionId }, false);
        throw new Error('Неверные параметры запроса');
      }

      // Проверяем валидность ответа
      if (!['a', 'b', 'c', 'd'].includes(selectedAnswer.toLowerCase())) {
        await auditLog(userId, 'quiz_answer_invalid_option', { selectedAnswer }, false);
        throw new Error('Неверный вариант ответа');
      }

      try {
        const today = new Date().toISOString().split('T')[0];

        // Проверяем существующий прогресс
        const { data: existingProgress } = await supabase
          .from('user_quiz_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .single();

        let newProgress;
        if (existingProgress) {
          // Обновляем прогресс
          const newQuestionsAnswered = existingProgress.questions_answered + 1;
          const newCorrectAnswers = existingProgress.correct_answers + (isCorrect ? 1 : 0);
          const isCompleted = newQuestionsAnswered >= 10;

          const { data, error } = await supabase
            .from('user_quiz_progress')
            .update({
              questions_answered: newQuestionsAnswered,
              correct_answers: newCorrectAnswers,
              completed: isCompleted
            })
            .eq('id', existingProgress.id)
            .select()
            .single();

          if (error) {
            console.error('Error updating quiz progress:', error);
            throw new Error('Не удалось обновить прогресс викторины');
          }

          newProgress = data;
        } else {
          // Создаем новый прогресс
          const { data, error } = await supabase
            .from('user_quiz_progress')
            .insert({
              user_id: userId,
              questions_answered: 1,
              correct_answers: isCorrect ? 1 : 0,
              date: today,
              completed: false
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating quiz progress:', error);
            throw new Error('Не удалось создать прогресс викторины');
          }

          newProgress = data;
        }

        await auditLog(userId, 'quiz_answer_success', { 
          questionId, 
          selectedAnswer, 
          isCorrect,
          progress: newProgress 
        });

        return { isCorrect, progress: newProgress };
      } catch (error) {
        console.error('Quiz answer error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-progress', userId] });
      
      if (data.isCorrect) {
        toast({
          title: "Правильно!",
          description: "Отличный ответ!",
        });
      } else {
        toast({
          title: "Неправильно",
          description: "Попробуйте еще раз!",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить ответ",
        variant: "destructive",
      });
    }
  });

  return {
    questions,
    progress,
    isLoading: questionsLoading || progressLoading,
    answerQuestion
  };
};
