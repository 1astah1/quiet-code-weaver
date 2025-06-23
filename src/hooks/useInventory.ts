
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateUUID, isValidUUID } from "@/utils/uuid";
import type { SafeSellSkinResponse } from "@/types/rpc";

export interface InventoryItem {
  id: string;
  skin_id: string;
  is_sold: boolean;
  obtained_at: string;
  sold_at?: string;
  sold_price?: number;
  skins: {
    id: string;
    name: string;
    weapon_type: string;
    rarity: string;
    price: number;
    image_url: string | null;
  };
}

export const useUserInventory = (userId: string) => {
  return useQuery({
    queryKey: ['user-inventory', userId],
    queryFn: async () => {
      console.log('🔄 [INVENTORY] Starting inventory query for user:', userId);
      
      if (!isValidUUID(userId)) {
        console.error('❌ [INVENTORY] Invalid user ID format:', userId);
        return [];
      }

      try {
        console.log('📡 [INVENTORY] Making Supabase request...');
        const startTime = Date.now();

        const { data, error } = await supabase
          .from('user_inventory')
          .select(`
            id,
            skin_id,
            is_sold,
            obtained_at,
            sold_at,
            sold_price,
            skins!inner (
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
        
        const duration = Date.now() - startTime;
        console.log(`⏱️ [INVENTORY] Query completed in ${duration}ms`);
        
        if (error) {
          console.error('❌ [INVENTORY] Supabase error:', error);
          throw error;
        }
        
        console.log('✅ [INVENTORY] Raw data received:', {
          itemCount: data?.length || 0,
          hasData: !!data,
          firstItem: data?.[0] || null
        });
        
        const inventoryItems = (data || []).map((item, index) => {
          console.log(`📦 [INVENTORY] Processing item ${index + 1}:`, {
            id: item.id,
            skinId: item.skin_id,
            skinName: item.skins?.name,
            hasImage: !!item.skins?.image_url,
            imageUrl: item.skins?.image_url,
            rarity: item.skins?.rarity,
            price: item.skins?.price
          });
          return item;
        });
        
        console.log('✅ [INVENTORY] Processing complete:', {
          totalProcessed: inventoryItems.length,
          withImages: inventoryItems.filter(item => item.skins?.image_url).length,
          withoutImages: inventoryItems.filter(item => !item.skins?.image_url).length
        });
        
        return inventoryItems as InventoryItem[];
      } catch (error) {
        console.error('💥 [INVENTORY] Unexpected error:', error);
        return [];
      }
    },
    enabled: !!userId && isValidUUID(userId),
    retry: (failureCount, error) => {
      console.log(`🔄 [INVENTORY] Retry attempt ${failureCount}:`, error);
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    staleTime: 2000
  });
};

export const useSellSkin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      inventoryId, 
      userId, 
      sellPrice 
    }: { 
      inventoryId: string; 
      userId: string; 
      sellPrice: number;
    }) => {
      try {
        console.log('💰 [SELL] Starting sell process:', { inventoryId, userId, sellPrice });
        const startTime = Date.now();
        
        if (!isValidUUID(userId) || !isValidUUID(inventoryId)) {
          console.error('❌ [SELL] Invalid UUID format:', { userId, inventoryId });
          throw new Error('Ошибка идентификации. Пожалуйста, перезагрузите страницу.');
        }

        console.log('📡 [SELL] Calling safe_sell_skin RPC...');
        const { data, error } = await supabase.rpc('safe_sell_skin', {
          p_user_id: userId,
          p_inventory_id: inventoryId,
          p_sell_price: sellPrice
        });

        if (error) {
          console.error('❌ [SELL] RPC error:', error);
          throw new Error(error.message || 'Не удалось продать скин');
        }

        // Типизируем ответ от RPC функции
        const result = data as unknown as SafeSellSkinResponse;

        const duration = Date.now() - startTime;
        console.log(`🎉 [SELL] Sale completed successfully in ${duration}ms:`, {
          inventoryId,
          sellPrice,
          newBalance: result?.new_balance
        });
        
        return { newCoins: result?.new_balance || 0 };
      } catch (error) {
        console.error('💥 [SELL] Sell operation failed:', error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      console.log('🎉 [SELL] Mutation success, invalidating queries...');
      const startTime = Date.now();
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] }),
        queryClient.refetchQueries({ queryKey: ['user-inventory', variables.userId] })
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`✅ [SELL] Queries invalidated in ${duration}ms`);
      
      toast({
        title: "Скин продан!",
        description: `Получено ${variables.sellPrice} монет`,
      });
      return data.newCoins;
    },
    onError: (error: any) => {
      console.error('🚨 [SELL] Mutation error callback:', error);
      toast({
        title: "Ошибка продажи",
        description: error.message || "Не удалось продать скин",
        variant: "destructive",
      });
    }
  });
};
