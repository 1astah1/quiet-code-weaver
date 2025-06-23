
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gift, Calendar, X } from "lucide-react";

interface DailyRewardsCalendarProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const DailyRewardsCalendar = ({ currentUser, onCoinsUpdate }: DailyRewardsCalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dailyRewards } = useQuery({
    queryKey: ['daily-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('is_active', true)
        .order('day_number', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: userRewards } = useQuery({
    queryKey: ['user-daily-rewards', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_daily_rewards')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: userData } = useQuery({
    queryKey: ['user-streak', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('daily_streak, last_daily_login')
        .eq('id', currentUser.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const claimRewardMutation = useMutation({
    mutationFn: async (dayNumber: number) => {
      const today = new Date().toISOString().split('T')[0];
      const reward = dailyRewards?.find(r => r.day_number === dayNumber);
      
      if (!reward) throw new Error('Награда не найдена');

      // Проверяем, можем ли мы получить награду
      const canClaim = await checkCanClaimReward(dayNumber);
      if (!canClaim) throw new Error('Награду нельзя получить');

      // Добавляем запись о получении награды
      const { error: claimError } = await supabase
        .from('user_daily_rewards')
        .insert({
          user_id: currentUser.id,
          day_number: dayNumber,
          reward_coins: reward.reward_coins
        });

      if (claimError) throw claimError;

      // Обновляем монеты пользователя и стрик
      const newCoins = currentUser.coins + reward.reward_coins;
      const newStreak = dayNumber;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          coins: newCoins,
          daily_streak: newStreak,
          last_daily_login: today
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      return { reward, newCoins, newStreak };
    },
    onSuccess: ({ reward, newCoins, newStreak }) => {
      onCoinsUpdate(newCoins);
      setCurrentStreak(newStreak);
      queryClient.invalidateQueries({ queryKey: ['user-daily-rewards', currentUser.id] });
      queryClient.invalidateQueries({ queryKey: ['user-streak', currentUser.id] });
      
      toast({
        title: "Награда получена!",
        description: `Получено ${reward.reward_coins} монет за день ${reward.day_number}`,
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

  const checkCanClaimReward = async (dayNumber: number): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    
    // Проверяем, получал ли уже награду за этот день
    const alreadyClaimed = userRewards?.some(r => r.day_number === dayNumber);
    if (alreadyClaimed) return false;

    // Проверяем последовательность дней
    const lastLogin = userData?.last_daily_login;
    const currentDailyStreak = userData?.daily_streak || 0;

    if (!lastLogin) {
      // Первый день - можем получить только день 1
      return dayNumber === 1;
    }

    const lastLoginDate = new Date(lastLogin);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Уже заходил сегодня - нельзя получить награду
      return false;
    } else if (diffDays === 1) {
      // Заходил вчера - можем получить следующий день
      return dayNumber === currentDailyStreak + 1;
    } else {
      // Пропустил дни - сбрасываем на день 1
      return dayNumber === 1;
    }
  };

  useEffect(() => {
    if (userData) {
      setCurrentStreak(userData.daily_streak || 0);
    }
  }, [userData]);

  const isRewardClaimed = (dayNumber: number) => {
    return userRewards?.some(r => r.day_number === dayNumber) || false;
  };

  const canClaimReward = async (dayNumber: number) => {
    return await checkCanClaimReward(dayNumber);
  };

  if (!isOpen) {
    return (
      <div className="mt-4 sm:mt-6">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm sm:text-base py-2 sm:py-3"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Ежедневные награды
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-xl w-full max-w-sm sm:max-w-2xl md:max-w-4xl max-h-[95vh] overflow-y-auto border border-slate-600">
        <div className="p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">Ежедневные награды</h2>
              <p className="text-slate-400 text-xs sm:text-base">Текущая серия: {currentStreak} дней</p>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              className="text-slate-400 hover:text-white p-1 sm:p-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3">
            {dailyRewards?.map((reward) => {
              const isClaimed = isRewardClaimed(reward.day_number);
              const isNextReward = reward.day_number === currentStreak + 1;
              const isPastReward = reward.day_number <= currentStreak;

              return (
                <div
                  key={reward.day_number}
                  className={`
                    relative p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all
                    ${isClaimed 
                      ? 'bg-green-900/50 border-green-500 text-green-400' 
                      : isNextReward 
                        ? 'bg-orange-900/50 border-orange-500 text-orange-400 animate-pulse' 
                        : isPastReward
                          ? 'bg-gray-900/50 border-gray-600 text-gray-500'
                          : 'bg-slate-800/50 border-slate-600 text-slate-400'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-[10px] xs:text-xs font-medium mb-1 sm:mb-2">День {reward.day_number}</div>
                    <div className="flex items-center justify-center mb-1 sm:mb-2">
                      <Gift className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="text-[10px] xs:text-xs font-bold">{reward.reward_coins}</div>
                    <div className="text-[8px] xs:text-[10px] opacity-75">монет</div>
                    
                    {isClaimed && (
                      <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 text-green-400 text-xs sm:text-sm">
                        ✓
                      </div>
                    )}
                    
                    {isNextReward && !isClaimed && (
                      <Button
                        onClick={() => claimRewardMutation.mutate(reward.day_number)}
                        disabled={claimRewardMutation.isPending}
                        className="mt-1 sm:mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white text-[10px] xs:text-xs py-1 px-1 sm:px-2 h-auto min-h-[20px] sm:min-h-[24px]"
                      >
                        {claimRewardMutation.isPending ? '...' : 'Получить'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 sm:mt-6 text-center text-slate-400 text-xs sm:text-sm">
            <p className="mb-1">Заходите каждый день, чтобы получать награды!</p>
            <p>Пропуск дня сбрасывает серию.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyRewardsCalendar;
