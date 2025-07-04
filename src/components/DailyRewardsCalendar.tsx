
import React from 'react';
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Gift, Coins, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import 'react/jsx-runtime';

interface DailyRewardsCalendarProps {
  currentUser?: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate?: (newCoins: number) => void;
}

interface ClaimRewardResponse {
  success: boolean;
  error?: string;
  reward_coins?: number;
  reward_day?: number;
  new_balance?: number;
  new_streak?: number;
  reward_type?: string;
}

const DailyRewardsCalendar = ({ currentUser, onCoinsUpdate }: DailyRewardsCalendarProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [timeUntilNextReward, setTimeUntilNextReward] = useState<number | null>(null);

  const { data: dailyRewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['daily_rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('is_active', true)
        .order('day_number', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['daily_progress'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, daily_streak, last_daily_login')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      const { data: claimedRewards, error: claimedError } = await supabase
        .from('user_daily_rewards')
        .select('day_number, claimed_at')
        .eq('user_id', userData.id)
        .order('claimed_at', { ascending: false });

      if (claimedError) throw claimedError;

      return {
        userId: userData.id,
        dailyStreak: userData.daily_streak || 0,
        lastDailyLogin: userData.last_daily_login,
        claimedRewards: claimedRewards || []
      };
    }
  });

  // Функция для проверки, может ли пользователь получить награду
  const canClaimReward = () => {
    if (!userProgress) return false;
    
    const now = new Date();
    const lastClaim = userProgress.claimedRewards[0]; // Самая последняя награда
    
    // Если наград еще не было, можно получить первую
    if (!lastClaim) return true;
    
    // Проверяем, прошло ли 24 часа с последней награды
    const lastClaimTime = lastClaim?.claimed_at ? new Date(lastClaim.claimed_at) : null;
    if (!lastClaimTime) return true;
    
    const hoursPassedSinceLastClaim = (now.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60);
    
    return hoursPassedSinceLastClaim >= 24;
  };

  // Таймер для обновления времени до следующей награды
  useEffect(() => {
    if (!userProgress?.claimedRewards[0]) {
      setTimeUntilNextReward(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const lastClaimTime = userProgress.claimedRewards[0].claimed_at;
      if (!lastClaimTime) return;
      
      const lastClaim = new Date(lastClaimTime);
      const nextRewardTime = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      
      if (now >= nextRewardTime) {
        setTimeUntilNextReward(null);
        // Обновляем данные, чтобы показать доступность новой награды
        queryClient.invalidateQueries({ queryKey: ['daily_progress'] });
      } else {
        const timeLeft = Math.ceil((nextRewardTime.getTime() - now.getTime()) / 1000);
        setTimeUntilNextReward(timeLeft);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [userProgress?.claimedRewards, queryClient]);

  const getNextClaimableDay = () => {
    if (!userProgress || !dailyRewards) return 1;
    
    const currentStreak = userProgress.dailyStreak || 0;
    return Math.min(currentStreak + 1, dailyRewards.length);
  };

  const formatTimeLeft = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    } else {
      return `${secs}с`;
    }
  };

  const handleClaimReward = async () => {
    if (isClaimingReward || !userProgress) return;
    setIsClaimingReward(true);
    try {
      // Вызов серверной функции
      const { error, data } = await supabase.rpc('safe_claim_daily_reward', {
        p_user_id: userProgress.userId
      });
      
      if (error) {
        console.error('RPC Error:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось получить награду',
          variant: 'destructive',
        });
        return;
      }
      
      const response = data as ClaimRewardResponse;
      
      if (!response?.success) {
        toast({
          title: 'Ошибка',
          description: response?.error === 'already_claimed_today' ? 'Награда уже получена сегодня' : 'Не удалось получить награду',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Награда получена!',
        description: `Вы получили ${response.reward_coins} монет за ${response.reward_day} день`,
      });
      
      if (onCoinsUpdate && response.new_balance !== undefined) {
        onCoinsUpdate(response.new_balance);
      }
      
      queryClient.invalidateQueries({ queryKey: ['daily_progress'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error) {
      console.error('Claim reward error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить награду',
        variant: 'destructive',
      });
    } finally {
      setIsClaimingReward(false);
    }
  };

  if (rewardsLoading || progressLoading) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5" />
            Ежедневные награды
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  const nextClaimableDay = getNextClaimableDay();
  const currentStreak = userProgress?.dailyStreak || 0;
  const canClaim = canClaimReward();

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5" />
          Ежедневные награды
        </CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline" className="border-blue-500 text-blue-400">
            Стрик: {currentStreak} дней
          </Badge>
          {canClaim && (
            <Badge variant="outline" className="border-green-500 text-green-400">
              Доступна награда!
            </Badge>
          )}
          {timeUntilNextReward && timeUntilNextReward > 0 && (
            <Badge variant="outline" className="border-orange-500 text-orange-400">
              Следующая через: {formatTimeLeft(timeUntilNextReward)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
          {dailyRewards?.map((reward: any) => {
            const dayNumber = reward.day_number;
            const isClaimed = userProgress?.claimedRewards.some(r => r.day_number === dayNumber) || false;
            const isNext = dayNumber === nextClaimableDay;
            const isAvailable = dayNumber <= currentStreak + 1;
            
            return (
              <div
                key={reward.id}
                className={`
                  relative p-3 rounded-lg border text-center transition-all
                  ${isClaimed 
                    ? 'bg-green-900/30 border-green-500/50' 
                    : isNext && canClaim
                    ? 'bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/30' 
                    : isAvailable
                    ? 'bg-slate-800 border-slate-600'
                    : 'bg-slate-800/50 border-slate-700 opacity-50'
                  }
                `}
              >
                <div className="text-xs text-gray-400 mb-1">День {dayNumber}</div>
                
                <div className="flex items-center justify-center mb-2">
                  {reward.reward_type === 'coins' ? (
                    <Coins className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <Crown className="w-6 h-6 text-purple-500" />
                  )}
                </div>
                
                <div className="text-sm font-semibold text-white">
                  {reward.reward_coins > 0 ? `${reward.reward_coins}` : 'Премиум'}
                </div>
                
                {isClaimed && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">✓</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canClaim && (
          <Button
            onClick={handleClaimReward}
            disabled={isClaimingReward}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Gift className="w-4 h-4 mr-2" />
            {isClaimingReward ? 'Получение...' : `Получить награду за ${nextClaimableDay} день`}
          </Button>
        )}

        {!canClaim && (
          <div className="text-center text-gray-400 text-sm">
            {timeUntilNextReward && timeUntilNextReward > 0
              ? `Следующая награда через: ${formatTimeLeft(timeUntilNextReward)}`
              : userProgress?.claimedRewards.length === 0 
              ? 'Получите первую ежедневную награду!'
              : 'Возвращайтесь завтра за следующей наградой'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyRewardsCalendar;
