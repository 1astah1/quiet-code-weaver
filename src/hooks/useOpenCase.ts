
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OpenCaseParams {
  userId: string;
  caseId: string;
  rewardType: 'skin' | 'coins';
  skinId?: string;
  coinRewardId?: string;
  isFree?: boolean;
}

export const useOpenCase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: OpenCaseParams) => {
      console.log('🎁 [OPEN_CASE] Opening case:', params);

      const { data, error } = await supabase.rpc('safe_open_case', {
        p_user_id: params.userId,
        p_case_id: params.caseId,
        p_reward_type: params.rewardType,
        p_skin_id: params.skinId || null,
        p_coin_reward_id: params.coinRewardId || null,
        p_is_free: params.isFree || false
      });

      if (error) {
        console.error('❌ [OPEN_CASE] Error:', error);
        throw new Error(error.message || 'Не удалось открыть кейс');
      }

      console.log('✅ [OPEN_CASE] Success:', data);
      return data;
    },
    onSuccess: async (data, variables) => {
      console.log('🎉 [OPEN_CASE] Case opened successfully');
      
      // Обновляем все связанные кэши
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] });
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['recent-wins'] });
      
      const reward = data.reward;
      if (reward.type === 'skin') {
        toast({
          title: "Поздравляем!",
          description: `Вы получили ${reward.name}!`,
        });
      } else {
        toast({
          title: "Поздравляем!",
          description: `Вы получили ${reward.amount} монет!`,
        });
      }
    },
    onError: (error: any) => {
      console.error('🚨 [OPEN_CASE] Error:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось открыть кейс",
        variant: "destructive",
      });
    }
  });
};
