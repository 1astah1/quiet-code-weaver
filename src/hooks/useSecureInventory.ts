
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientRateLimit } from '@/utils/simpleRateLimit';

export const useSecureInventory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const sellInProgress = useRef(false);

  const sellSkin = useCallback(async (inventoryItemId: string, userId: string) => {
    // Предотвращаем двойные клики
    if (sellInProgress.current) {
      console.log('⏳ [SELL] Sale already in progress, ignoring');
      return { success: false, error: 'Операция уже выполняется' };
    }

    // Проверяем rate limit
    const rateLimitKey = `sell_${userId}`;
    if (!clientRateLimit.checkLimit(rateLimitKey, 5, 30000)) {
      return { success: false, error: 'Слишком частые попытки продажи. Подождите немного.' };
    }

    sellInProgress.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log('💰 [SELL] Starting skin sale:', {
        inventoryItemId,
        userId
      });

      // Валидация параметров
      if (!inventoryItemId || !userId) {
        throw new Error('Неверные параметры для продажи скина');
      }

      // Оптимистичное обновление UI - сначала убираем предмет из инвентаря
      queryClient.setQueryData(['user-inventory', userId], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((item: any) => item.id !== inventoryItemId);
      });

      // Вызываем функцию продажи
      const { data, error: sellError } = await supabase.rpc('final_sell_item', {
        p_inventory_id: inventoryItemId,
        p_user_id: userId
      });

      if (sellError) {
        console.error('❌ [SELL] RPC error:', sellError);
        
        // Откатываем оптимистичное обновление
        queryClient.invalidateQueries({ queryKey: ['user-inventory', userId] });
        
        throw new Error(sellError.message || 'Не удалось продать скин');
      }

      if (!data || data.length === 0) {
        queryClient.invalidateQueries({ queryKey: ['user-inventory', userId] });
        throw new Error('Сервер не вернул результат операции');
      }
      
      const result = data[0];

      if (!result.success) {
        console.error('📉 [SELL] Sale failed:', result.message);
        queryClient.invalidateQueries({ queryKey: ['user-inventory', userId] });
        throw new Error(result.message || 'Операция продажи не была выполнена');
      }

      console.log('✅ [SELL] Skin sold successfully:', {
        newBalance: result.new_balance,
      });

      // Обновляем кэш баланса если есть другие запросы
      queryClient.invalidateQueries({ queryKey: ['user-balance', userId] });

      return {
        success: true,
        newBalance: result.new_balance
      };
    } catch (err) {
      console.error('💥 [SELL] Error selling skin:', err);
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
      setError(errorMessage);
      
      // Обновляем инвентарь при ошибке
      queryClient.invalidateQueries({ queryKey: ['user-inventory', userId] });
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
      sellInProgress.current = false;
    }
  }, [queryClient]);

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

      console.log('🔍 [INVENTORY] Loading inventory for user:', userId);

      try {
        // Используем упрощенный запрос без сложных подзапросов
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
          console.error('❌ [INVENTORY] Error loading inventory:', error);
          throw error;
        }
        
        console.log('✅ [INVENTORY] Loaded inventory items:', data?.length || 0);
        return data || [];
      } catch (err) {
        console.error('💥 [INVENTORY] Critical error:', err);
        throw err;
      }
    },
    refetchOnWindowFocus: false, // Уменьшаем количество запросов
    refetchOnMount: true,
    staleTime: 30000, // Кэшируем на 30 секунд
    retry: (failureCount: number, error: any) => {
      // Не повторяем при ошибках RLS
      if (error && typeof error === 'object' && 'code' in error && error.code === '21000') {
        return false;
      }
      return failureCount < 2;
    },
  });
}
