import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Calendar, Gift, Coins, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DailyRewardsCalendarProps {
  currentUser?: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate?: (newCoins: number) => void;
}

const DailyRewardsCalendar = ({ currentUser, onCoinsUpdate }: DailyRewardsCalendarProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClaimingReward, setIsClaimingReward] = useState(false);

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
        .eq('user_id', userData.id);

      if (claimedError) throw claimedError;

      return {
        userId: userData.id,
        dailyStreak: userData.daily_streak || 0,
        lastDailyLogin: userData.last_daily_login,
        claimedRewards: claimedRewards || []
      };
    }
  });

  const canClaimToday = () => {
    if (!userProgress) return false;
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const lastLogin = userProgress.lastDailyLogin;
    
    // Проверяем, входил ли пользователь сегодня
    const hasLoggedInToday = lastLogin === todayString;
    
    // Проверяем, получал ли уже награду сегодня
    const hasClaimedToday = userProgress.claimedRewards.some(reward => {
      const claimedDate = reward.claimed_at ? new Date(reward.claimed_at).toISOString().split('T')[0] : null;
      return claimedDate === todayString;
    });
    
    return hasLoggedInToday && !hasClaimedToday;
  };

  const getNextClaimableDay = () => {
    if (!userProgress || !dailyRewards) return 1;
    
    const currentStreak = userProgress.dailyStreak || 0;
    return Math.min(currentStreak + 1, dailyRewards.length);
  };

  const handleClaimReward = async () => {
    if (isClaimingReward || !userProgress) return;
    setIsClaimingReward(true);
    try {
      // Вызов серверной функции
      const { error, data } = await supabase.rpc('safe_claim_daily_reward', {
        p_user_id: userProgress.userId
      });
      if (error || !data || !data.success) {
        toast({
          title: 'Ошибка',
          description: data?.error === 'already_claimed_today' ? 'Награда уже получена сегодня' : 'Не удалось получить награду',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Награда получена!',
        description: `Вы получили ${data.reward_coins} монет за ${data.reward_day} день`,
      });
      if (onCoinsUpdate && data.new_balance !== undefined) {
        onCoinsUpdate(data.new_balance);
      }
      queryClient.invalidateQueries({ queryKey: ['daily_progress'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error) {
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
          {canClaimToday() && (
            <Badge variant="outline" className="border-green-500 text-green-400">
              Доступна награда!
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
                    : isNext && canClaimToday()
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

        {canClaimToday() && (
          <Button
            onClick={handleClaimReward}
            disabled={isClaimingReward}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Gift className="w-4 h-4 mr-2" />
            {isClaimingReward ? 'Получение...' : `Получить награду за ${nextClaimableDay} день`}
          </Button>
        )}

        {!canClaimToday() && (
          <div className="text-center text-gray-400 text-sm">
            {userProgress?.lastDailyLogin === new Date().toISOString().split('T')[0]
              ? 'Награда уже получена сегодня'
              : 'Войдите завтра для получения следующей награды'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyRewardsCalendar;
