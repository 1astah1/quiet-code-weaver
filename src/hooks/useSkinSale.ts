
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSkinSale = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      inventoryId, 
      userId, 
      price 
    }: { 
      inventoryId: string; 
      userId: string; 
      price: number; 
    }) => {
      console.log('🛒 [SKIN_SALE] Starting sale process:', { inventoryId, userId, price });

      // Помечаем скин как проданный
      const { error: updateError } = await supabase
        .from('user_inventory')
        .update({
          is_sold: true,
          sold_at: new Date().toISOString(),
          sold_price: price
        })
        .eq('id', inventoryId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ [SKIN_SALE] Error updating inventory:', updateError);
        throw new Error('Не удалось обновить инвентарь');
      }

      // Добавляем монеты пользователю
      const { error: coinsError } = await supabase.rpc('safe_update_coins', {
        p_user_id: userId,
        p_coin_change: price,
        p_operation_type: 'skin_sale'
      });

      if (coinsError) {
        console.error('❌ [SKIN_SALE] Error updating coins:', coinsError);
        throw new Error('Не удалось обновить баланс');
      }

      console.log('✅ [SKIN_SALE] Sale completed successfully');
      return { price };
    },
    onSuccess: async (data, variables) => {
      console.log('🎉 [SKIN_SALE] Mutation success, invalidating queries...');
      
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] });
      
      toast({
        title: "Скин продан!",
        description: `Получено ${data.price} монет`,
      });
    },
    onError: (error: any) => {
      console.error('🚨 [SKIN_SALE] Mutation error:', error);
      toast({
        title: "Ошибка продажи",
        description: error.message || "Не удалось продать скин",
        variant: "destructive",
      });
    }
  });
};
