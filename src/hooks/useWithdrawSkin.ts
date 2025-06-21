
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
  console.log('💰 [WITHDRAW_SKIN] Hook mounting/rendering');
  
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
      console.log('🚀 [WITHDRAW_SKIN] Starting withdrawal process:', { inventoryItemId, steamTradeUrl });

      if (!steamTradeUrl || !steamTradeUrl.includes('steamcommunity.com')) {
        console.error('❌ [WITHDRAW_SKIN] Invalid Steam Trade URL:', steamTradeUrl);
        throw new Error('Неверная Steam Trade URL');
      }

      console.log('📡 [WITHDRAW_SKIN] Calling withdraw-skin function...');
      const { data, error } = await supabase.functions.invoke('withdraw-skin', {
        body: {
          inventoryItemId,
          steamTradeUrl
        }
      });

      if (error) {
        console.error('❌ [WITHDRAW_SKIN] Function error:', error);
        throw error;
      }

      if (!data.success) {
        console.error('❌ [WITHDRAW_SKIN] Function returned failure:', data);
        throw new Error(data.error || 'Ошибка при создании запроса на вывод');
      }

      console.log('✅ [WITHDRAW_SKIN] Withdrawal request created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 [WITHDRAW_SKIN] Mutation success, showing toast and invalidating queries');
      toast({
        title: "Запрос на вывод создан!",
        description: data.message || "Проверьте Steam для подтверждения трейда",
      });
      
      // Обновляем инвентарь
      queryClient.invalidateQueries({ queryKey: ['user-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
    },
    onError: (error: any) => {
      console.error('🚨 [WITHDRAW_SKIN] Mutation error:', error);
      toast({
        title: "Ошибка вывода",
        description: error.message || "Не удалось создать запрос на вывод",
        variant: "destructive",
      });
    }
  });
};

export const useWithdrawalRequests = (userId: string) => {
  console.log('📋 [WITHDRAWAL_REQUESTS] Hook mounting/rendering for user:', userId);
  
  return useQuery({
    queryKey: ['withdrawal-requests', userId],
    queryFn: async () => {
      console.log('📡 [WITHDRAWAL_REQUESTS] Starting query for user:', userId);
      const startTime = Date.now();

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
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ [WITHDRAWAL_REQUESTS] Query completed in ${duration}ms`);
      
      if (error) {
        console.error('❌ [WITHDRAWAL_REQUESTS] Query error:', error);
        throw error;
      }
      
      console.log('✅ [WITHDRAWAL_REQUESTS] Query success:', {
        requestsCount: data?.length || 0,
        requests: data?.map(r => ({ id: r.id, status: r.status })) || []
      });
      
      return (data || []) as WithdrawalRequest[];
    },
    enabled: !!userId,
    retry: (failureCount, error) => {
      console.log(`🔄 [WITHDRAWAL_REQUESTS] Retry attempt ${failureCount}:`, error);
      return failureCount < 2;
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });
};
