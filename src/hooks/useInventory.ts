import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateUUID, isValidUUID } from "@/utils/uuid";

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
          console.error('❌ [INVENTORY] Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        console.log('✅ [INVENTORY] Raw data received:', {
          itemCount: data?.length || 0,
          hasData: !!data,
          firstItem: data?.[0] || null
        });
        
        // Проверяем и логируем каждый элемент инвентаря
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
        console.error('💥 [INVENTORY] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return [];
      }
    },
    enabled: !!userId && isValidUUID(userId),
    retry: (failureCount, error) => {
      console.log(`🔄 [INVENTORY] Retry attempt ${failureCount}:`, error);
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
    refetchInterval: () => {
      console.log('⏰ [INVENTORY] Interval refetch triggered');
      return 10000;
    },
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

        console.log('👤 [SELL] Checking user existence...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, coins')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('❌ [SELL] User check error:', userError);
          if (userError.code === 'PGRST116') {
            throw new Error('Пользователь не найден');
          }
          throw new Error('Не удалось получить данные пользователя');
        }

        console.log('✅ [SELL] User found:', { id: userData.id, coins: userData.coins });

        console.log('📦 [SELL] Checking inventory item...');
        const { data: inventoryItem, error: inventoryCheckError } = await supabase
          .from('user_inventory')
          .select('*')
          .eq('id', inventoryId)
          .eq('user_id', userId)
          .eq('is_sold', false)
          .single();

        if (inventoryCheckError) {
          console.error('❌ [SELL] Inventory check error:', inventoryCheckError);
          if (inventoryCheckError.code === 'PGRST116') {
            throw new Error('Предмет не найден в инвентаре или уже продан');
          }
          throw new Error('Ошибка проверки инвентаря');
        }

        console.log('✅ [SELL] Inventory item found:', inventoryItem);

        const currentCoins = userData.coins || 0;
        const newCoins = currentCoins + sellPrice;
        
        console.log('💰 [SELL] Coin calculation:', { 
          current: currentCoins, 
          adding: sellPrice, 
          newTotal: newCoins 
        });

        console.log('🔄 [SELL] Marking item as sold...');
        const { error: sellError } = await supabase
          .from('user_inventory')
          .update({
            is_sold: true,
            sold_at: new Date().toISOString(),
            sold_price: sellPrice
          })
          .eq('id', inventoryId)
          .eq('user_id', userId)
          .eq('is_sold', false);

        if (sellError) {
          console.error('❌ [SELL] Mark as sold error:', sellError);
          throw new Error('Не удалось продать скин');
        }

        console.log('✅ [SELL] Item marked as sold');

        console.log('💰 [SELL] Updating user balance...');
        const { error: coinsError } = await supabase
          .from('users')
          .update({ coins: newCoins })
          .eq('id', userId);

        if (coinsError) {
          console.error('❌ [SELL] Coins update error:', coinsError);
          console.log('🔄 [SELL] Rolling back item sale...');
          await supabase
            .from('user_inventory')
            .update({
              is_sold: false,
              sold_at: null,
              sold_price: null
            })
            .eq('id', inventoryId);
          throw new Error('Не удалось обновить баланс');
        }

        const duration = Date.now() - startTime;
        console.log(`🎉 [SELL] Sale completed successfully in ${duration}ms:`, {
          inventoryId,
          sellPrice,
          newBalance: newCoins
        });
        
        return { newCoins };
      } catch (error) {
        console.error('💥 [SELL] Sell operation failed:', error);
        console.error('💥 [SELL] Error details:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      console.log('🎉 [SELL] Mutation success, invalidating queries...');
      const startTime = Date.now();
      
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] });
      await queryClient.refetchQueries({ queryKey: ['user-inventory', variables.userId] });
      
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
