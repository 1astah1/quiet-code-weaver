import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SafeSellSkinResponse } from '@/types/rpc';

export const useSecureInventory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sellSkin = async (inventoryItemId: string, skinPrice: number, userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('💰 [SECURE_INVENTORY] Starting skin sale:', { 
        inventoryItemId, 
        skinPrice, 
        userId 
      });

      // Проверяем валидность параметров
      if (!inventoryItemId || !userId || skinPrice <= 0) {
        throw new Error('Неверные параметры для продажи скина');
      }

      // Используем безопасную функцию продажи
      const { data, error: sellError } = await supabase.rpc('safe_sell_skin', {
        p_user_id: userId,
        p_inventory_id: inventoryItemId,
        p_sell_price: skinPrice
      });

      if (sellError) {
        console.error('❌ [SECURE_INVENTORY] RPC error:', sellError);
        throw new Error(sellError.message || 'Не удалось продать скин');
      }

      if (!data) {
        throw new Error('Сервер не вернул результат операции');
      }

      // Типизируем ответ от RPC функции
      const result = data as unknown as SafeSellSkinResponse;

      if (!result.success) {
        throw new Error('Операция продажи не была выполнена');
      }

      console.log('✅ [SECURE_INVENTORY] Skin sold successfully:', {
        newBalance: result.new_balance,
        soldPrice: skinPrice
      });

      return { 
        success: true, 
        newBalance: result.new_balance 
      };
    } catch (err) {
      console.error('💥 [SECURE_INVENTORY] Error selling skin:', err);
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
