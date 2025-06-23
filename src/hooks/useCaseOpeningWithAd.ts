
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateUUID, isValidUUID } from "@/utils/uuid";

export interface CaseOpeningWithAdResult {
  success: boolean;
  reward?: any;
  inventory_id?: string;
  new_balance?: number;
  roulette_items?: any[];
  winner_position?: number;
  error?: string;
  required?: number;
  current?: number;
  next_available?: string;
}

export const useCaseOpeningWithAd = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      caseId, 
      isFree = false,
      adWatched = false,
      skinId = null,
      coinRewardId = null
    }: { 
      userId: string; 
      caseId: string; 
      isFree?: boolean;
      adWatched?: boolean;
      skinId?: string | null;
      coinRewardId?: string | null;
    }) => {
      try {
        console.log('🎮 [CASE_OPENING_AD] Starting case opening with ad:', { 
          userId, 
          caseId, 
          isFree, 
          adWatched,
          skinId,
          coinRewardId
        });
        
        if (!isValidUUID(userId) || !isValidUUID(caseId)) {
          throw new Error('Ошибка идентификации. Пожалуйста, перезагрузите страницу.');
        }

        // Для бесплатных кейсов требуется просмотр рекламы
        if (isFree && !adWatched) {
          return {
            success: false,
            error: 'Ad view required for free case'
          };
        }

        const { data, error } = await supabase.rpc('safe_open_case', {
          p_user_id: userId,
          p_case_id: caseId,
          p_skin_id: skinId,
          p_coin_reward_id: coinRewardId,
          p_is_free: isFree,
          p_ad_watched: adWatched
        });

        if (error) {
          console.error('❌ [CASE_OPENING_AD] RPC error:', error);
          throw new Error(error.message || 'Не удалось открыть кейс');
        }

        const result = data as CaseOpeningWithAdResult;
        console.log('✅ [CASE_OPENING_AD] Case opened successfully:', result);
        
        return result;
      } catch (error) {
        console.error('💥 [CASE_OPENING_AD] Case opening failed:', error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      if (data.success) {
        console.log('🎉 [CASE_OPENING_AD] Invalidating queries after successful opening...');
        
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] }),
          queryClient.invalidateQueries({ queryKey: ['user-balance', variables.userId] }),
          queryClient.invalidateQueries({ queryKey: ['recent-wins'] }),
          queryClient.invalidateQueries({ queryKey: ['cases'] })
        ]);

        toast({
          title: "Кейс открыт!",
          description: data.reward?.type === 'coin_reward' 
            ? `Получено ${data.reward.amount} монет` 
            : `Получен скин: ${data.reward?.name}`,
        });
      } else {
        // Обрабатываем ошибки без показа toast, так как они будут обработаны в UI
        console.log('⚠️ [CASE_OPENING_AD] Case opening failed:', data.error);
      }
    },
    onError: (error: any) => {
      console.error('🚨 [CASE_OPENING_AD] Mutation error:', error);
      toast({
        title: "Ошибка открытия кейса",
        description: error.message || "Не удалось открыть кейс",
        variant: "destructive",
      });
    }
  });
};
