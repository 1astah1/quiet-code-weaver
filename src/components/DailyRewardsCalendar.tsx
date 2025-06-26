
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gift, Coins, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";

interface DailyReward {
  id: string;
  day_number: number;
  reward_type: string;
  reward_coins: number;
  reward_item_id: string | null;
  is_active: boolean;
}

interface UserDailyReward {
  id: string;
  user_id: string;
  day_number: number;
  reward_coins: number;
  claimed_at: string | null;
}

interface DailyRewardsCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const DailyRewardsCalendar = ({ isOpen, onClose, currentUser, onCoinsUpdate }: DailyRewardsCalendarProps) => {
  const [rewards, setRewards] = useState<DailyReward[]>([]);
  const [userRewards, setUserRewards] = useState<UserDailyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchRewards();
      fetchUserRewards();
    }
  }, [isOpen, currentUser.id]);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('is_active', true)
        .order('day_number');

      if (error) throw error;
      setRewards(data || []);
    } catch (error: any) {
      console.error('Error fetching rewards:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить награды",
        variant: "destructive"
      });
    }
  };

  const fetchUserRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('user_daily_rewards')
        .select('*')
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setUserRewards(data || []);
    } catch (error: any) {
      console.error('Error fetching user rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConsecutiveDays = () => {
    const today = new Date();
    let consecutiveDays = 0;
    
    // Проверяем последовательные дни с сегодняшнего дня назад
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasReward = userRewards.some(reward => {
        if (!reward.claimed_at) return false;
        const rewardDate = new Date(reward.claimed_at);
        return rewardDate.toDateString() === checkDate.toDateString();
      });
      
      if (hasReward) {
        consecutiveDays = i + 1;
      } else if (i === 0) {
        // Если сегодня не получена награда, проверяем можно ли получить
        break;
      } else {
        break;
      }
    }
    
    return consecutiveDays;
  };

  const canClaimDay = (dayNumber: number) => {
    const consecutiveDays = getConsecutiveDays();
    const today = new Date();
    
    // Можно получить награду за сегодняшний день, если:
    // 1. Это следующий день в последовательности
    // 2. Награда еще не получена сегодня
    const todayReward = userRewards.find(reward => {
      if (!reward.claimed_at) return false;
      const rewardDate = new Date(reward.claimed_at);
      return rewardDate.toDateString() === today.toDateString();
    });
    
    return dayNumber === consecutiveDays + 1 && !todayReward;
  };

  const isRewardClaimed = (dayNumber: number) => {
    const consecutiveDays = getConsecutiveDays();
    return dayNumber <= consecutiveDays;
  };

  const claimReward = async (dayNumber: number) => {
    if (claiming || !canClaimDay(dayNumber)) return;

    setClaiming(dayNumber);
    
    try {
      const reward = rewards.find(r => r.day_number === dayNumber);
      if (!reward) throw new Error('Reward not found');

      // Добавляем награду пользователю
      const { error: insertError } = await supabase
        .from('user_daily_rewards')
        .insert({
          user_id: currentUser.id,
          day_number: dayNumber,
          reward_coins: reward.reward_coins,
          claimed_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Обновляем баланс пользователя
      const newCoins = currentUser.coins + (reward.reward_coins || 0);
      const { error: updateError } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Обновляем состояние
      onCoinsUpdate(newCoins);
      await fetchUserRewards();

      toast({
        title: "Награда получена!",
        description: `Вы получили ${reward.reward_coins} монет за день ${dayNumber}`,
      });

    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось получить награду",
        variant: "destructive"
      });
    } finally {
      setClaiming(null);
    }
  };

  if (!isOpen) return null;

  const consecutiveDays = getConsecutiveDays();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700/50 shadow-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Ежедневные награды</h3>
                <p className="text-slate-400">Дней подряд: {consecutiveDays}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-slate-400 mt-2">Загрузка...</p>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-3">
                {rewards.map((reward) => (
                  <motion.div
                    key={reward.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all ${
                        isRewardClaimed(reward.day_number)
                          ? 'bg-green-900/20 border-green-500/30'
                          : canClaimDay(reward.day_number)
                            ? 'bg-orange-900/20 border-orange-500/50 hover:border-orange-400'
                            : 'bg-slate-800 border-slate-700'
                      }`}
                      onClick={() => canClaimDay(reward.day_number) && claimReward(reward.day_number)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-sm font-medium text-slate-300 mb-2">
                          День {reward.day_number}
                        </div>
                        
                        <div className="mb-3">
                          {isRewardClaimed(reward.day_number) ? (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                              <Gift className="w-4 h-4 text-white" />
                            </div>
                          ) : canClaimDay(reward.day_number) ? (
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                              <Gift className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center mx-auto">
                              <Gift className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-center gap-1 text-xs">
                          <Coins className="w-3 h-3 text-yellow-500" />
                          <span className="text-slate-300">{reward.reward_coins}</span>
                        </div>

                        {canClaimDay(reward.day_number) && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {claiming === reward.day_number ? 'Получение...' : 'Получить'}
                          </Badge>
                        )}

                        {isRewardClaimed(reward.day_number) && (
                          <Badge variant="default" className="mt-2 text-xs bg-green-600">
                            Получено
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center text-sm text-slate-400">
              <p>Получайте награды каждый день подряд!</p>
              <p>Пропуск дня сбрасывает последовательность.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DailyRewardsCalendar;
