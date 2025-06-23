
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecureInventory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sellSkin = async (inventoryItemId: string, skinPrice: number, userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('💰 [SECURE_INVENTORY] Selling skin:', { inventoryItemId, skinPrice, userId });

      // Используем новую безопасную функцию продажи
      const { data, error: sellError } = await supabase.rpc('safe_sell_skin', {
        p_user_id: userId,
        p_inventory_id: inventoryItemId,
        p_sell_price: skinPrice
      });

      if (sellError) {
        console.error('❌ [SECURE_INVENTORY] Sell error:', sellError);
        throw new Error(sellError.message || 'Не удалось продать скин');
      }

      console.log('✅ [SECURE_INVENTORY] Skin sold successfully:', data);
      return { success: true, newBalance: data?.new_balance };
    } catch (err) {
      console.error('💥 [SECURE_INVENTORY] Error selling skin:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sellSkin,
    isLoading,
    error
  };
};
