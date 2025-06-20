
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useGenerateReferralCode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Генерируем уникальный реферальный код
      const referralCode = `REF${userId.slice(0, 8).toUpperCase()}${Date.now().toString().slice(-4)}`;
      
      // Проверяем уникальность кода
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (existingUser) {
        throw new Error('Код уже существует, попробуйте еще раз');
      }

      // Обновляем пользователя с новым реферальным кодом
      const { data, error } = await supabase
        .from('users')
        .update({ referral_code: referralCode })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-data'] });
      toast({
        title: "Реферальный код создан!",
        description: `Ваш код: ${data.referral_code}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useProcessReferral = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ referralCode, newUserId }: { referralCode: string; newUserId: string }) => {
      // Находим пользователя по реферальному коду
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError || !referrer) {
        throw new Error('Реферальный код не найден');
      }

      // Проверяем, что новый пользователь еще не использовал реферальный код
      const { data: existingReferral } = await supabase
        .from('users')
        .select('referred_by')
        .eq('id', newUserId)
        .single();

      if (existingReferral?.referred_by) {
        throw new Error('Вы уже использовали реферальный код');
      }

      // Обновляем нового пользователя
      const { error: updateError } = await supabase
        .from('users')
        .update({ referred_by: referralCode })
        .eq('id', newUserId);

      if (updateError) throw updateError;

      // Начисляем монеты рефереру
      const referrerNewCoins = (referrer.coins || 0) + 50;
      const { error: coinsError } = await supabase
        .from('users')
        .update({ coins: referrerNewCoins })
        .eq('id', referrer.id);

      if (coinsError) throw coinsError;

      // Записываем в таблицу заработков от рефералов
      const { error: earningsError } = await supabase
        .from('referral_earnings')
        .insert({
          referrer_id: referrer.id,
          referred_id: newUserId,
          coins_earned: 50
        });

      if (earningsError) throw earningsError;

      return { referrer, coinsEarned: 50 };
    },
    onSuccess: (data) => {
      toast({
        title: "Реферальная программа",
        description: `Реферер получил ${data.coinsEarned} монет!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};
