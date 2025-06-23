
import { useInventoryData } from './useInventoryData';
import { useSkinSale } from './useSkinSale';
import { useSellAllSkins } from './useSellAllSkins';

export const useInventory = (userId: string | undefined) => {
  const inventoryQuery = useInventoryData(userId);
  const skinSaleMutation = useSkinSale();
  const sellAllMutation = useSellAllSkins();

  const sellSkin = (inventoryId: string, price: number) => {
    if (!userId) return;
    skinSaleMutation.mutate({ inventoryId, userId, price });
  };

  const sellAllSkins = () => {
    if (!userId) return;
    sellAllMutation.mutate({ userId });
  };

  return {
    // Data
    inventory: inventoryQuery.data || [],
    isLoading: inventoryQuery.isLoading,
    error: inventoryQuery.error,
    
    // Actions
    sellSkin,
    sellAllSkins,
    
    // States
    isSelling: skinSaleMutation.isPending,
    isSellingAll: sellAllMutation.isPending,
    
    // Utils
    refetch: inventoryQuery.refetch
  };
};

// Export individual hooks for direct use
export const useUserInventory = useInventoryData;
export const useSellSkin = useSkinSale;
