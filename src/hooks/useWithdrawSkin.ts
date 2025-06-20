
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  inventory_item_id: string;
  steam_trade_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  steam_trade_offer_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const useWithdrawSkin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      inventoryItemId, 
      steamTradeUrl 
    }: { 
      inventoryItemId: string; 
      steamTradeUrl: string;
    }) => {
      console.log('Starting skin withdrawal:', { inventoryItemId, steamTradeUrl });

      if (!steamTradeUrl || !steamTradeUrl.includes('steamcommunity.com')) {
        throw new Error('Неверная Steam Trade URL');
      }

      const { data, error } = await supabase.functions.invoke('withdraw-skin', {
        body: {
          inventoryItemId,
          steamTradeUrl
        }
      });

      if (error) {
        console.error('Withdrawal function error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Ошибка при создании запроса на вывод');
      }

      console.log('Withdrawal request created:', data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Запрос на вывод создан!",
        description: data.message || "Проверьте Steam для подтверждения трейда",
      });
      
      // Обновляем инвентарь
      queryClient.invalidateQueries({ queryKey: ['user-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
    },
    onError: (error: any) => {
      console.error('Withdrawal error:', error);
      toast({
        title: "Ошибка вывода",
        description: error.message || "Не удалось создать запрос на вывод",
        variant: "destructive",
      });
    }
  });
};

export const useWithdrawalRequests = (userId: string) => {
  return useQuery({
    queryKey: ['withdrawal-requests', userId],
    queryFn: async () => {
      console.log('Loading withdrawal requests for user:', userId);

      const { data, error } = await supabase
        .from('skin_withdrawal_requests')
        .select(`
          *,
          user_inventory (
            *,
            skins (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading withdrawal requests:', error);
        throw error;
      }
      
      console.log('Withdrawal requests loaded:', data?.length || 0);
      return (data || []) as WithdrawalRequest[];
    },
    enabled: !!userId,
    retry: 2,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });
};
