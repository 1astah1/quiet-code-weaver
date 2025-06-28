
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useSecureInventory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sellSkin = async (inventoryItemId: string, userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('💰 [FINAL_SELL_ITEM] Starting skin sale:', {
        inventoryItemId,
        userId
      });

      // Проверяем валидность параметров
      if (!inventoryItemId || !userId) {
        throw new Error('Неверные параметры для продажи скина');
      }

      // Используем финальную функцию продажи
      const { data, error: sellError } = await supabase.rpc('final_sell_item', {
        p_inventory_id: inventoryItemId,
        p_user_id: userId
      });

      if (sellError) {
        console.error('❌ [FINAL_SELL_ITEM] RPC error:', sellError);
        throw new Error(sellError.message || 'Не удалось продать скин');
      }

      if (!data || data.length === 0) {
        throw new Error('Сервер не вернул результат операции');
      }
      
      const result = data[0];

      if (!result.success) {
        console.error('📉 [FINAL_SELL_ITEM] Sale failed:', result.message);
        throw new Error(result.message || 'Операция продажи не была выполнена');
      }

      console.log('✅ [FINAL_SELL_ITEM] Skin sold successfully:', {
        newBalance: result.new_balance,
      });

      return {
        success: true,
        newBalance: result.new_balance
      };
    } catch (err) {
      console.error('💥 [FINAL_SELL_ITEM] Error selling skin:', err);
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sellSkin,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

export function useUserInventory(userId: string) {
  return useQuery({
    queryKey: ['user-inventory', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          *,
          skins (
            id,
            name,
            weapon_type,
            rarity,
            price,
            image_url
          )
        `)
        .eq('user_id', userId)
        .eq('is_sold', false)
        .order('obtained_at', { ascending: false });
      
      if (error) {
        console.error('❌ [USER_INVENTORY] Error loading inventory:', error);
        throw error;
      }
      
      console.log('✅ [USER_INVENTORY] Loaded inventory items:', data?.length || 0);
      return data || [];
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
