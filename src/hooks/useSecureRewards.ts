
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityRateLimiter, auditLog } from "@/utils/security";
import { isValidUUID } from "@/utils/uuid";

export const useSecureRewards = (userId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dailyRewards = [] } = useQuery({
    queryKey: ['daily-rewards'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('daily_rewards')
          .select('*')
          .eq('is_active', true)
          .order('day_number');

        if (error) {
          console.error('Error loading daily rewards:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Daily rewards query error:', error);
        return [];
      }
    },
    retry: 2
  });

  const { data: userRewards = [] } = useQuery({
    queryKey: ['user-daily-rewards', userId],
    queryFn: async () => {
      if (!isValidUUID(userId)) {
        console.error('Invalid user ID format:', userId);
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('user_daily_rewards')
          .select('*')
          .eq('user_id', userId)
          .order('claimed_at', { ascending: false });

        if (error) {
          console.error('Error loading user daily rewards:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('User daily rewards query error:', error);
        return [];
      }
    },
    enabled: !!userId && isValidUUID(userId),
    retry: 2
  });

  const claimDailyReward = useMutation({
    mutationFn: async ({ dayNumber }: { dayNumber: number }) => {
      if (!SecurityRateLimiter.canPerformAction(userId, 'claim_daily_reward')) {
        const remaining = SecurityRateLimiter.getRemainingTime(userId, 'claim_daily_reward');
        throw new Error(`Слишком частые попытки получения награды. Попробуйте через ${Math.ceil(remaining / 1000)} секунд`);
      }

      if (!isValidUUID(userId)) {
        await auditLog(userId, 'claim_daily_reward_invalid_user', { dayNumber }, false);
        throw new Error('Неверный ID пользователя');
      }

      if (dayNumber < 1 || dayNumber > 30) {
        await auditLog(userId, 'claim_daily_reward_invalid_day', { dayNumber }, false);
        throw new Error('Неверный номер дня');
      }

      try {
        // Проверяем, можно ли получить награду с помощью функции базы данных
        const { data: canClaim, error: timeCheckError } = await supabase.rpc('check_time_limit', {
          p_user_id: userId,
          p_action_type: 'daily_reward',
          p_interval_minutes: 1440 // 24 часа
        });

        if (timeCheckError) {
          console.error('Error checking time limit:', timeCheckError);
          throw new Error('Не удалось проверить временное ограничение');
        }

        if (!canClaim) {
          throw new Error('Ежедневную награду можно получить только раз в сутки');
        }

        // Проверяем, не получал ли пользователь уже эту награду
        const { data: existingReward, error: checkError } = await supabase
          .from('user_daily_rewards')
          .select('id')
          .eq('user_id', userId)
          .eq('day_number', dayNumber)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing reward:', checkError);
          throw new Error('Не удалось проверить существующие награды');
        }

        if (existingReward) {
          throw new Error('Награда за этот день уже получена');
        }

        // Получаем информацию о награде
        const { data: rewardData, error: rewardError } = await supabase
          .from('daily_rewards')
          .select('reward_coins')
          .eq('day_number', dayNumber)
          .eq('is_active', true)
          .single();

        if (rewardError) {
          console.error('Error getting reward data:', rewardError);
          throw new Error('Награда не найдена');
        }

        // Используем безопасную функцию для обновления монет
        const { error: coinsError } = await supabase.rpc('safe_update_coins', {
          p_user_id: userId,
          p_coin_change: rewardData.reward_coins,
          p_operation_type: 'daily_reward'
        });

        if (coinsError) {
          console.error('Error updating coins:', coinsError);
          throw new Error('Не удалось начислить монеты');
        }

        // Записываем получение награды
        const { error: claimError } = await supabase
          .from('user_daily_rewards')
          .insert({
            user_id: userId,
            day_number: dayNumber,
            reward_coins: rewardData.reward_coins
          });

        if (claimError) {
          console.error('Error recording reward claim:', claimError);
          throw new Error('Не удалось записать получение награды');
        }

        // Обновляем время последнего входа
        await supabase
          .from('users')
          .update({ last_daily_login: new Date().toISOString().split('T')[0] })
          .eq('id', userId);

        await auditLog(userId, 'daily_reward_claimed', { 
          dayNumber, 
          rewardCoins: rewardData.reward_coins 
        });

        return { rewardCoins: rewardData.reward_coins };
      } catch (error) {
        console.error('Claim daily reward error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-daily-rewards', userId] });
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

  return {
    dailyRewards,
    userRewards,
    claimDailyReward
  };
};
