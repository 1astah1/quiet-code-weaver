
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSellAllSkins = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      console.log('🛒 [SELL_ALL] Starting sell all process for user:', userId);
      
      try {
        // Вызываем функцию продажи всех скинов
        const { data, error } = await supabase.rpc('sell_all_user_skins', {
          p_user_id: userId
        });

        if (error) {
          console.error('❌ [SELL_ALL] Error:', error);
          throw new Error(error.message || 'Не удалось продать все скины');
        }

        console.log('✅ [SELL_ALL] Success:', data);
        return {
          totalValue: data.total_earned,
          itemCount: data.items_sold
        };
      } catch (error) {
        console.error('💥 [SELL_ALL] Sell all operation failed:', error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      console.log('🎉 [SELL_ALL] Mutation success, invalidating queries...');
      
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] });
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
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
