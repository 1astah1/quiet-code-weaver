
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";

interface TaskProgress {
  [taskId: string]: 'available' | 'completed' | 'claimed';
}

interface CompleteTaskParams {
  taskId: string;
}

interface ClaimRewardParams {
  taskId: string;
  rewardCoins: number;
}

export const useSecureTaskProgress = (userId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [taskProgress, setTaskProgress] = useState<TaskProgress>({});

  const getTaskStatus = useCallback((taskId: string): 'available' | 'completed' | 'claimed' => {
    return taskProgress[taskId] || 'available';
  }, [taskProgress]);

  const completeTask = useMutation({
    mutationFn: async ({ taskId }: CompleteTaskParams) => {
      console.log('🎯 Completing task:', { userId, taskId });
      
      // Simple task completion logic
      setTaskProgress(prev => ({ ...prev, [taskId]: 'completed' }));
      
      return { success: true };
    },
    onSuccess: (data, variables) => {
      console.log('✅ Task completed successfully:', variables.taskId);
      toast({
        title: "Задание выполнено!",
        description: "Теперь вы можете забрать награду",
      });
    },
    onError: (error: any) => {
      console.error('❌ Task completion error:', error);
      toast({
        title: "Ошибка выполнения",
        description: error.message || "Не удалось выполнить задание",
        variant: "destructive",
      });
    }
  });

  const claimReward = useMutation({
    mutationFn: async ({ taskId, rewardCoins }: ClaimRewardParams) => {
      console.log('💰 Claiming reward:', { userId, taskId, rewardCoins });
      
      // Update user coins
      const { error } = await supabase.rpc('safe_update_coins', {
        p_user_id: userId,
        p_coin_change: rewardCoins,
        p_operation_type: 'task_reward'
      });

      if (error) {
        throw new Error('Не удалось начислить награду: ' + error.message);
      }

      // Mark task as claimed
      setTaskProgress(prev => ({ ...prev, [taskId]: 'claimed' }));
      
      return { rewardCoins };
    },
    onSuccess: (data, variables) => {
      console.log('🎉 Reward claimed successfully:', data);
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      toast({
        title: "Награда получена!",
        description: `Вы получили ${data.rewardCoins} монет`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Reward claim error:', error);
      toast({
        title: "Ошибка получения награды",
        description: error.message || "Не удалось получить награду",
        variant: "destructive",
      });
    }
  });

  return {
    taskProgress,
    completeTask,
    claimReward,
    getTaskStatus
  };
};
