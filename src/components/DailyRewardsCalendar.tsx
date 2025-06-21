
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
      <div className="mt-6">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Ежедневные награды
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-600">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Ежедневные награды</h2>
              <p className="text-slate-400">Текущая серия: {currentStreak} дней</p>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
            {dailyRewards?.map((reward) => {
              const isClaimed = isRewardClaimed(reward.day_number);
              const isNextReward = reward.day_number === currentStreak + 1;
              const isPastReward = reward.day_number <= currentStreak;

              return (
                <div
                  key={reward.day_number}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all
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
                    <div className="text-xs font-medium mb-2">День {reward.day_number}</div>
                    <div className="flex items-center justify-center mb-2">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold">{reward.reward_coins} монет</div>
                    
                    {isClaimed && (
                      <div className="absolute top-1 right-1 text-green-400">
                        ✓
                      </div>
                    )}
                    
                    {isNextReward && !isClaimed && (
                      <Button
                        onClick={() => claimRewardMutation.mutate(reward.day_number)}
                        disabled={claimRewardMutation.isPending}
                        className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs py-1"
                      >
                        Получить
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center text-slate-400 text-sm">
            <p>Заходите каждый день, чтобы получать награды!</p>
            <p>Пропуск дня сбрасывает серию.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyRewardsCalendar;
