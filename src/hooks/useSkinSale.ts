
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSkinSale = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ inventoryId, userId, price }: { 
      inventoryId: string; 
      userId: string; 
      price: number;
    }) => {
      console.log('💰 Selling skin:', { inventoryId, userId, price });

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
        console.error('❌ Error marking skin as sold:', updateError);
        throw updateError;
      }

      // Обновляем баланс пользователя
      const { error: coinError } = await supabase.rpc('safe_update_coins_v2', {
        p_user_id: userId,
        p_coin_change: price,
        p_operation_type: 'skin_sale'
      });

      if (coinError) {
        console.error('❌ Error updating user balance:', coinError);
        throw coinError;
      }

      console.log('✅ Skin sold successfully');
      return { price };
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      
      toast({
        title: "Скин продан!",
        description: `Получено ${data.price} монет`,
      });
    },
    onError: (error: any) => {
      console.error('🚨 Skin sale error:', error);
      toast({
        title: "Ошибка продажи",
        description: error.message || "Не удалось продать скин",
        variant: "destructive",
      });
    }
  });
};
