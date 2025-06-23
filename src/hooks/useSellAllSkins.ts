
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SellAllResult {
  items_sold: number;
  total_earned: number;
}

export const useSellAllSkins = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }): Promise<SellAllResult> => {
      console.log('🛒 Selling all skins for user:', userId);
      
      const { data: sellResult, error } = await supabase.rpc('sell_all_user_skins', {
        p_user_id: userId
      });

      if (error) {
        console.error('❌ Sell all error:', error);
        throw new Error('Не удалось продать предметы: ' + error.message);
      }

      console.log('✅ All items sold successfully:', sellResult);
      return sellResult as SellAllResult;
    },
    onSuccess: async (data, variables) => {
      console.log('🎉 Mutation success, refreshing data...');
      
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      
      toast({
        title: "Все скины проданы!",
        description: `Продано ${data.items_sold} предметов на ${data.total_earned} монет`,
      });
      
      return data.total_earned;
    },
    onError: (error: any) => {
      console.error('🚨 Mutation error:', error);
      toast({
        title: "Ошибка продажи",
        description: error.message || "Не удалось продать все скины",
        variant: "destructive",
      });
    }
  });
};
