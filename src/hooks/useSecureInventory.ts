
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecureInventory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sellSkin = async (inventoryItemId: string, skinPrice: number, userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Update inventory item as sold
      const { error: updateError } = await supabase
        .from('user_inventory')
        .update({
          is_sold: true,
          sold_at: new Date().toISOString(),
          sold_price: skinPrice
        })
        .eq('id', inventoryItemId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Add coins to user using the existing safe_update_coins function
      const { data, error: coinsError } = await supabase.rpc('safe_update_coins', {
        p_user_id: userId,
        p_coin_change: skinPrice,
        p_operation_type: 'skin_sale'
      });

      if (coinsError) throw coinsError;
      if (!data) throw new Error('Failed to update coins');

      return { success: true };
    } catch (err) {
      console.error('Error selling skin:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
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
