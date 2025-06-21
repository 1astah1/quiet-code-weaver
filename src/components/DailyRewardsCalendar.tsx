
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Gift, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DailyRewardsCalendarProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

interface DailyReward {
  id: string;
  day_number: number;
  reward_coins: number;
  reward_type: string;
  reward_item_id?: string;
  is_active: boolean;
}

interface UserDailyReward {
  id: string;
  day_number: number;
  claimed_at: string;
  reward_coins: number;
}

const DailyRewardsCalendar = ({ currentUser, onCoinsUpdate }: DailyRewardsCalendarProps) => {
  const [currentDay, setCurrentDay] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получаем награды за 30 дней
  const { data: dailyRewards } = useQuery({
    queryKey: ['daily-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('is_active', true)
        .order('day_number');
      
      if (error) throw error;
      return data as DailyReward[];
    }
  });

  // Получаем полученные пользователем награды
  const { data: userRewards } = useQuery({
    queryKey: ['user-daily-rewards', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_daily_rewards')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
      return data as UserDailyReward[];
    }
  });

  // Получаем информацию о последнем входе пользователя
  const { data: userData } = useQuery({
    queryKey: ['user-data', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('last_daily_login, daily_streak')
        .eq('id', currentUser.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Вычисляем текущий день на основе серии входов
  useEffect(() => {
    if (userData && userRewards) {
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = userData.last_daily_login;
      
      if (lastLogin === today) {
        // Пользователь уже заходил сегодня
        setCurrentDay(Math.min(30, (userData.daily_streak || 0) + 1));
      } else {
        // Новый день
        const claimedDays = userRewards.length;
        setCurrentDay(Math.min(30, claimedDays + 1));
      }
    }
  }, [userData, userRewards]);

  const claimRewardMutation = useMutation({
    mutationFn: async (dayNumber: number) => {
      const reward = dailyRewards?.find(r => r.day_number === dayNumber);
      if (!reward) throw new Error('Reward not found');

      // Проверяем, можно ли получить награду за этот день
      const isAlreadyClaimed = userRewards?.some(ur => ur.day_number === dayNumber);
      if (isAlreadyClaimed) {
        throw new Error('Reward already claimed');
      }

      // Проверяем, что пользователь может получить только текущий день
      if (dayNumber !== currentDay) {
        throw new Error('Can only claim current day reward');
      }

      const today = new Date().toISOString().split('T')[0];
      const lastLogin = userData?.last_daily_login;

      let newStreak = 1;
      if (lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        const todayDate = new Date(today);
        const daysDiff = (todayDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff === 1) {
          // Consecutive day
          newStreak = Math.min(30, (userData?.daily_streak || 0) + 1);
        } else if (daysDiff === 0) {
          // Same day - don't claim again
          throw new Error('Already claimed today');
        } else {
          // Break in streak
          newStreak = 1;
        }
      }

      // Обновляем пользователя
      const newCoins = currentUser.coins + reward.reward_coins;
      const { error: userError } = await supabase
        .from('users')
        .update({
          coins: newCoins,
          last_daily_login: today,
          daily_streak: newStreak
        })
        .eq('id', currentUser.id);

      if (userError) throw userError;

      // Записываем полученную награду
      const { error: rewardError } = await supabase
        .from('user_daily_rewards')
        .insert({
          user_id: currentUser.id,
          day_number: dayNumber,
          reward_coins: reward.reward_coins
        });

      if (rewardError) throw rewardError;

      return { newCoins, reward };
    },
    onSuccess: (data) => {
      onCoinsUpdate(data.newCoins);
      queryClient.invalidateQueries({ queryKey: ['user-daily-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['user-data'] });
      
      toast({
        title: "Награда получена!",
        description: `Получено ${data.reward.reward_coins} монет`,
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

  const handleClaimReward = (dayNumber: number) => {
    claimRewardMutation.mutate(dayNumber);
  };

  const isRewardClaimed = (dayNumber: number) => {
    return userRewards?.some(ur => ur.day_number === dayNumber) || false;
  };

  const canClaimReward = (dayNumber: number) => {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = userData?.last_daily_login;
    
    // Можно получить награду только за текущий день
    return dayNumber === currentDay && lastLogin !== today;
  };

  if (!dailyRewards) {
    return (
      <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 rounded-lg p-4 border border-purple-500/30">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 rounded-lg p-4 border border-purple-500/30">
      <div className="flex items-center space-x-3 mb-4">
        <Calendar className="w-6 h-6 text-purple-400" />
        <div>
          <h3 className="text-white font-semibold text-base">Ежедневные награды</h3>
          <p className="text-gray-400 text-sm">Заходи каждый день и получай бонусы</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dailyRewards.slice(0, 30).map((reward) => {
          const isClaimed = isRewardClaimed(reward.day_number);
          const canClaim = canClaimReward(reward.day_number);
          const isCurrentDay = reward.day_number === currentDay;
          const isFutureDay = reward.day_number > currentDay;

          return (
            <div
              key={reward.id}
              className={`relative p-2 rounded-lg border text-center transition-all ${
                isClaimed
                  ? 'bg-green-500/20 border-green-500/50'
                  : canClaim
                    ? 'bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30 cursor-pointer'
                    : isCurrentDay
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : isFutureDay
                        ? 'bg-gray-700/20 border-gray-600/50'
                        : 'bg-red-500/20 border-red-500/50'
              }`}
              onClick={() => canClaim && handleClaimReward(reward.day_number)}
            >
              <div className="text-xs text-gray-400 mb-1">День {reward.day_number}</div>
              
              <div className="flex items-center justify-center space-x-1 mb-1">
                {isClaimed ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : canClaim ? (
                  <Gift className="w-3 h-3 text-orange-400" />
                ) : isFutureDay ? (
                  <Clock className="w-3 h-3 text-gray-400" />
                ) : (
                  <Gift className="w-3 h-3 text-gray-400" />
                )}
              </div>
              
              <div className="text-xs font-bold text-yellow-400">
                +{reward.reward_coins}
              </div>
              
              {isCurrentDay && !isClaimed && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current reward info */}
      <div className="bg-gray-800/50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">
              День {currentDay}: {dailyRewards.find(r => r.day_number === currentDay)?.reward_coins || 0} монет
            </p>
            <p className="text-gray-400 text-xs">
              {isRewardClaimed(currentDay) 
                ? 'Награда получена' 
                : canClaimReward(currentDay)
                  ? 'Доступно для получения'
                  : 'Приходи завтра за новой наградой'
              }
            </p>
          </div>
          
          {canClaimReward(currentDay) && (
            <Button
              onClick={() => handleClaimReward(currentDay)}
              disabled={claimRewardMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm"
            >
              {claimRewardMutation.isPending ? 'Получение...' : 'Получить'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyRewardsCalendar;
