
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/toast';

interface WithdrawSkinParams {
  inventoryItemId: string;
  steamTradeUrl: string;
}

export const useWithdrawSkin = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ inventoryItemId, steamTradeUrl }: WithdrawSkinParams) => {
      console.log('🔄 [WITHDRAW] Starting skin withdrawal:', { inventoryItemId, steamTradeUrl });

      // Валидация Steam Trade URL
      if (!steamTradeUrl.includes('steamcommunity.com') || !steamTradeUrl.includes('tradeoffer')) {
        throw new Error('Неверный формат Steam Trade URL');
      }

      // Получаем информацию о предмете из инвентаря
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*, skins(*)')
        .eq('id', inventoryItemId)
        .single();

      if (inventoryError || !inventoryItem) {
        throw new Error('Предмет не найден в инвентаре');
      }

      if (inventoryItem.is_sold) {
        throw new Error('Этот предмет уже продан');
      }

      if (!inventoryItem.user_id) {
        throw new Error('Не удалось определить владельца предмета');
      }

      // Создаем запрос на вывод
      const { data: withdrawalRequest, error: withdrawalError } = await supabase
        .from('skin_withdrawal_requests')
        .insert({
          user_id: inventoryItem.user_id,
          inventory_item_id: inventoryItemId,
          steam_trade_url: steamTradeUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error('❌ [WITHDRAW] Error creating withdrawal request:', withdrawalError);
        throw new Error('Не удалось создать запрос на вывод');
      }

      console.log('✅ [WITHDRAW] Withdrawal request created:', withdrawalRequest.id);
      return withdrawalRequest;
    },
    onSuccess: () => {
      toast({
        title: "Запрос отправлен",
        description: "Запрос на вывод скина успешно создан. Мы свяжемся с вами в Steam.",
      });
    },
    onError: (error: Error) => {
      console.error('💥 [WITHDRAW] Error:', error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};
