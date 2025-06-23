
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskProgress {
  id: string;
  user_id: string;
  task_id: string;
  status: 'available' | 'completed' | 'claimed';
  completed_at?: string;
  claimed_at?: string;
}

export const useTaskProgress = (userId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загружаем прогресс заданий пользователя
  const { data: taskProgress = [], isLoading, error } = useQuery({
    queryKey: ['task-progress', userId],
    queryFn: async () => {
      console.log('📊 Loading task progress for user:', userId);
      
      const { data, error } = await supabase
        .from('user_task_progress')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ Error loading task progress:', error);
        throw error;
      }
      
      console.log('✅ Task progress loaded:', data.length, 'records');
      return data as TaskProgress[];
    },
    enabled: !!userId,
    staleTime: 30000
  });

  // Мутация для выполнения задания
  const completeTask = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      console.log('🎯 Completing task:', taskId);
      
      const { data, error } = await supabase.rpc('safe_complete_task', {
        p_user_id: userId,
        p_task_id: taskId
      });

      if (error) {
        console.error('❌ Error completing task:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        console.error('❌ Task completion failed:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Task completed successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-progress', userId] });
      toast({
        title: "Задание выполнено!",
        description: "Теперь вы можете забрать награду",
      });
    },
    onError: (error: Error) => {
      console.error('💥 Task completion error:', error);
      toast({
        title: "Ошибка выполнения задания",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Мутация для получения награды
  const claimReward = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      console.log('🎁 Claiming reward for task:', taskId);
      
      const { data, error } = await supabase.rpc('safe_claim_task_reward', {
        p_user_id: userId,
        p_task_id: taskId
      });

      if (error) {
        console.error('❌ Error claiming reward:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        console.error('❌ Reward claim failed:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Reward claimed successfully:', data.reward_coins, 'coins');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-progress', userId] });
      toast({
        title: "Награда получена!",
        description: `Получено ${data.reward_coins} монет`,
      });
    },
    onError: (error: Error) => {
      console.error('💥 Reward claim error:', error);
      toast({
        title: "Ошибка получения награды",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Функция для получения статуса задания
  const getTaskStatus = (taskId: string): 'available' | 'completed' | 'claimed' => {
    const progress = taskProgress.find(p => p.task_id === taskId);
    return progress?.status || 'available';
  };

  return {
    taskProgress,
    completeTask,
    claimReward,
    getTaskStatus,
    isLoading,
    error
  };
};
