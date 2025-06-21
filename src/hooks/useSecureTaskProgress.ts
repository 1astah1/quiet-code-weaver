
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityRateLimiter, auditLog, validateInput } from "@/utils/security";
import { isValidUUID } from "@/utils/uuid";

interface TaskProgress {
  id: string;
  task_id: string;
  status: 'available' | 'completed' | 'claimed';
  completed_at?: string;
  claimed_at?: string;
}

export const useSecureTaskProgress = (userId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: taskProgress, isLoading } = useQuery({
    queryKey: ['task-progress', userId],
    queryFn: async () => {
      if (!isValidUUID(userId)) {
        console.error('Invalid user ID format:', userId);
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('user_task_progress')
          .select('*')
          .eq('user_id', userId);

        if (error) {
          console.error('Error loading task progress:', error);
          await auditLog(userId, 'task_progress_load_failed', { error: error.message }, false);
          return [];
        }

        await auditLog(userId, 'task_progress_loaded', { count: data?.length || 0 });
        return (data || []) as TaskProgress[];
      } catch (error) {
        console.error('Task progress query error:', error);
        return [];
      }
    },
    enabled: !!userId && isValidUUID(userId),
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 10000
  });

  const completeTask = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      if (!SecurityRateLimiter.canPerformAction(userId, 'complete_task')) {
        const remaining = SecurityRateLimiter.getRemainingTime(userId, 'complete_task');
        throw new Error(`Слишком быстрое выполнение заданий. Попробуйте через ${Math.ceil(remaining / 1000)} секунд`);
      }

      if (!isValidUUID(userId) || !isValidUUID(taskId)) {
        await auditLog(userId, 'complete_task_invalid_params', { taskId }, false);
        throw new Error('Неверные параметры запроса');
      }

      try {
        const { error } = await supabase
          .from('user_task_progress')
          .upsert({
            user_id: userId,
            task_id: taskId,
            status: 'completed',
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,task_id'
          });

        if (error) {
          console.error('Error completing task:', error);
          await auditLog(userId, 'complete_task_failed', { error: error.message, taskId }, false);
          throw new Error('Не удалось отметить задание как выполненное');
        }

        await auditLog(userId, 'complete_task_success', { taskId });
        return { taskId };
      } catch (error) {
        console.error('Complete task error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-progress', userId] });
      toast({
        title: "Задание выполнено!",
        description: "Теперь заберите награду",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось выполнить задание",
        variant: "destructive",
      });
    }
  });

  const claimReward = useMutation({
    mutationFn: async ({ taskId, rewardCoins }: { taskId: string; rewardCoins: number }) => {
      if (!SecurityRateLimiter.canPerformAction(userId, 'claim_task_reward')) {
        const remaining = SecurityRateLimiter.getRemainingTime(userId, 'claim_task_reward');
        throw new Error(`Слишком быстрое получение наград. Попробуйте через ${Math.ceil(remaining / 1000)} секунд`);
      }

      if (!isValidUUID(userId) || !isValidUUID(taskId)) {
        await auditLog(userId, 'claim_reward_invalid_params', { taskId, rewardCoins }, false);
        throw new Error('Неверные параметры запроса');
      }

      if (!validateInput.skinPrice(rewardCoins)) {
        await auditLog(userId, 'claim_reward_invalid_amount', { rewardCoins }, false);
        throw new Error('Недопустимая сумма награды');
      }

      try {
        // Используем новую безопасную функцию для обновления монет
        const { error: coinsError } = await supabase.rpc('safe_update_coins_v2', {
          p_user_id: userId,
          p_coin_change: rewardCoins,
          p_operation_type: 'task_reward'
        });

        if (coinsError) {
          console.error('Error updating coins:', coinsError);
          throw new Error('Не удалось начислить монеты');
        }

        // Обновляем статус задания
        const { error: taskError } = await supabase
          .from('user_task_progress')
          .update({
            status: 'claimed',
            claimed_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('task_id', taskId)
          .eq('status', 'completed');

        if (taskError) {
          console.error('Error updating task status:', taskError);
          await auditLog(userId, 'claim_reward_task_update_failed', { error: taskError.message, taskId }, false);
          throw new Error('Не удалось обновить статус задания');
        }

        await auditLog(userId, 'claim_reward_success', { taskId, rewardCoins });
        return { rewardCoins };
      } catch (error) {
        console.error('Claim reward error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-coins', userId] });
      toast({
        title: "Награда получена!",
        description: `Получено ${data.rewardCoins} монет`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось получить награду",
        variant: "destructive",
      });
    }
  });

  const getTaskStatus = (taskId: string): 'available' | 'completed' | 'claimed' => {
    const progress = taskProgress?.find(p => p.task_id === taskId);
    return progress?.status || 'available';
  };

  return {
    taskProgress,
    isLoading,
    completeTask,
    claimReward,
    getTaskStatus
  };
};
