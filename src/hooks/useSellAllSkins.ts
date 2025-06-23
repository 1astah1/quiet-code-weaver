
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isValidUUID } from "@/utils/uuid";

export const useSellAllSkins = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      console.log('🛒 [SELL_ALL] Starting sell all process for user:', userId);
      
      if (!isValidUUID(userId)) {
        throw new Error('Ошибка идентификации. Пожалуйста, перезагрузите страницу.');
      }

      try {
        // Получаем все непроданные скины пользователя
        const { data: inventoryItems, error: inventoryError } = await supabase
          .from('user_inventory')
          .select(`
            id,
            skins!inner (
              price
            )
          `)
          .eq('user_id', userId)
          .eq('is_sold', false);

        if (inventoryError) {
          console.error('❌ [SELL_ALL] Error fetching inventory:', inventoryError);
          throw new Error('Не удалось получить инвентарь');
        }

        if (!inventoryItems || inventoryItems.length === 0) {
          throw new Error('В инвентаре нет предметов для продажи');
        }

        console.log('📦 [SELL_ALL] Found items to sell:', inventoryItems.length);

        // Вычисляем общую стоимость
        const totalValue = inventoryItems.reduce((sum, item) => sum + (item.skins?.price || 0), 0);
        console.log('💰 [SELL_ALL] Total value:', totalValue);

        // Помечаем все скины как проданные (обрабатываем каждый по отдельности для правильной цены)
        for (const item of inventoryItems) {
          const { error: sellError } = await supabase
            .from('user_inventory')
            .update({
              is_sold: true,
              sold_at: new Date().toISOString(),
              sold_price: item.skins?.price || 0
            })
            .eq('id', item.id)
            .eq('user_id', userId)
            .eq('is_sold', false);

          if (sellError) {
            console.error('❌ [SELL_ALL] Error marking item as sold:', sellError);
            throw new Error('Не удалось продать предметы');
          }
        }

        // Обновляем баланс пользователя
        const { error: coinsError } = await supabase.rpc('safe_update_coins_v2', {
          p_user_id: userId,
          p_coin_change: totalValue,
          p_operation_type: 'sell_all_skins'
        });

        if (coinsError) {
          console.error('❌ [SELL_ALL] Error updating coins:', coinsError);
          // Откатываем продажу предметов
          const inventoryIds = inventoryItems.map(item => item.id);
          await supabase
            .from('user_inventory')
            .update({
              is_sold: false,
              sold_at: null,
              sold_price: null
            })
            .in('id', inventoryIds);
          
          throw new Error('Не удалось обновить баланс');
        }

        console.log('✅ [SELL_ALL] All items sold successfully');
        return { totalValue, itemCount: inventoryItems.length };
      } catch (error) {
        console.error('💥 [SELL_ALL] Sell all operation failed:', error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      console.log('🎉 [SELL_ALL] Mutation success, invalidating queries...');
      
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] });
      await queryClient.refetchQueries({ queryKey: ['user-inventory', variables.userId] });
      
      toast({
        title: "Все скины проданы!",
        description: `Продано ${data.itemCount} предметов на ${data.totalValue} монет`,
      });
      
      return data.totalValue;
    },
    onError: (error: any) => {
      console.error('🚨 [SELL_ALL] Mutation error:', error);
      toast({
        title: "Ошибка продажи",
        description: error.message || "Не удалось продать все скины",
        variant: "destructive",
      });
    }
  });
};
