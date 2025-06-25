import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";

interface WithdrawSkinParams {
  inventoryItemId: string;
  steamTradeUrl: string;
}

export const useWithdrawSkin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inventoryItemId, steamTradeUrl }: WithdrawSkinParams) => {
      console.log('🎮 [WITHDRAW_SKIN] Starting withdrawal:', { inventoryItemId, steamTradeUrl });

      // Валидация Trade URL
      if (!steamTradeUrl.includes('steamcommunity.com') || !steamTradeUrl.includes('tradeoffer')) {
        throw new Error('Неверный формат Steam Trade URL');
      }

      // Вызываем Edge Function для создания трейда
      const { data, error } = await supabase.functions.invoke('withdraw-skin', {
        body: {
          inventoryItemId,
          steamTradeUrl
        }
      });

      if (error) {
        console.error('❌ [WITHDRAW_SKIN] Edge function error:', error);
        throw new Error(error.message || 'Ошибка создания трейда');
      }

      if (!data || !data.success) {
        console.error('❌ [WITHDRAW_SKIN] Withdrawal failed:', data);
        throw new Error(data?.error || 'Не удалось создать трейд');
      }

      console.log('✅ [WITHDRAW_SKIN] Withdrawal successful:', data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Трейд создан!",
        description: `Скин "${data.skinName}" отправлен в Steam. Проверьте трейды в Steam.`,
        duration: 5000,
      });

      // Обновляем инвентарь
      queryClient.invalidateQueries({ queryKey: ['user-inventory'] });
    },
    onError: (error: Error) => {
      console.error('💥 [WITHDRAW_SKIN] Mutation error:', error);
      toast({
        title: "Ошибка вывода",
        description: error.message || "Не удалось вывести скин",
        variant: "destructive",
      });
    }
  });
}; 