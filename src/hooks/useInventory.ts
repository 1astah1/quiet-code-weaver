
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { enhancedValidation, SecurityMonitor, secureOperation } from "@/utils/securityEnhanced";
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
      console.log('🔄 [INVENTORY] Starting secure inventory query for user:', userId);
      
      if (!enhancedValidation.uuid(userId)) {
        console.error('❌ [INVENTORY] Invalid user ID format:', userId);
        await SecurityMonitor.logSuspiciousActivity(userId, 'invalid_inventory_request', { userId }, 'high');
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
          await SecurityMonitor.logSuspiciousActivity(userId, 'inventory_query_error', { error: error.message }, 'medium');
          throw error;
        }
        
        console.log('✅ [INVENTORY] Raw data received:', {
          itemCount: data?.length || 0,
          hasData: !!data
        });
        
        // Валидация и санитизация данных инвентаря
        const validatedItems = (data || []).filter(item => {
          return (
            enhancedValidation.uuid(item.id) &&
            enhancedValidation.uuid(item.skin_id) &&
            item.skins &&
            enhancedValidation.uuid(item.skins.id) &&
            item.skins.name &&
            typeof item.skins.name === 'string' &&
            enhancedValidation.skinPrice(item.skins.price)
          );
        }).map((item, index) => {
          console.log(`📦 [INVENTORY] Processing item ${index + 1}:`, {
            id: item.id,
            skinId: item.skin_id,
            skinName: item.skins?.name,
            hasImage: !!item.skins?.image_url,
            rarity: item.skins?.rarity,
            price: item.skins?.price
          });

          return {
            ...item,
            skins: {
              ...item.skins,
              name: enhancedValidation.sanitizeString(item.skins.name),
              weapon_type: enhancedValidation.sanitizeString(item.skins.weapon_type || ''),
              rarity: enhancedValidation.sanitizeString(item.skins.rarity || ''),
              price: Math.max(0, Math.min(1000000, Math.floor(item.skins.price)))
            }
          };
        });
        
        console.log('✅ [INVENTORY] Processing complete:', {
          totalProcessed: validatedItems.length,
          withImages: validatedItems.filter(item => item.skins?.image_url).length,
          withoutImages: validatedItems.filter(item => !item.skins?.image_url).length
        });
        
        return validatedItems as InventoryItem[];
      } catch (error) {
        console.error('💥 [INVENTORY] Unexpected error:', error);
        await SecurityMonitor.logSuspiciousActivity(userId, 'inventory_unexpected_error', 
          { error: error instanceof Error ? error.message : 'Unknown error' }, 'medium');
        return [];
      }
    },
    enabled: !!userId && enhancedValidation.uuid(userId),
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
      console.log('💰 [SELL] Starting secure sell process:', { inventoryId, userId, sellPrice });
      
      return await secureOperation(
        async () => {
          const startTime = Date.now();
          
          // Валидация входных данных
          if (!enhancedValidation.uuid(userId) || !enhancedValidation.uuid(inventoryId)) {
            throw new Error('Ошибка идентификации. Пожалуйста, перезагрузите страницу.');
          }

          if (!enhancedValidation.skinPrice(sellPrice)) {
            throw new Error('Некорректная цена продажи.');
          }

          // Проверяем на аномальную активность
          if (SecurityMonitor.detectAnomalousActivity(userId, 'sell', sellPrice)) {
            throw new Error('Обнаружена подозрительная активность.');
          }

          console.log('📡 [SELL] Calling secure safe_sell_skin RPC...');
          
          // Используем улучшенную RPC функцию с проверкой аутентификации
          const { data, error } = await supabase.rpc('safe_sell_skin', {
            p_user_id: userId,
            p_inventory_id: inventoryId,
            p_sell_price: sellPrice
          });

          if (error) {
            console.error('❌ [SELL] RPC error:', error);
            
            // Логируем подозрительную активность при ошибках
            await SecurityMonitor.logSuspiciousActivity(
              userId, 
              'sell_error', 
              { error: error.message, inventoryId, sellPrice },
              'medium'
            );
            
            throw new Error(error.message || 'Не удалось продать скин');
          }

          // Типизируем ответ от RPC функции
          const result = data as unknown as SafeSellSkinResponse;

          if (!result?.success) {
            await SecurityMonitor.logSuspiciousActivity(
              userId, 
              'sell_failed', 
              { inventoryId, sellPrice },
              'low'
            );
            throw new Error('Операция продажи не была выполнена');
          }

          const duration = Date.now() - startTime;
          console.log(`🎉 [SELL] Sale completed successfully in ${duration}ms:`, {
            inventoryId,
            sellPrice,
            newBalance: result.new_balance
          });
          
          return { newCoins: result.new_balance || 0 };
        },
        userId,
        'sell_skin',
        { inventoryId, sellPrice }
      );
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
    onError: async (error: any, variables) => {
      console.error('🚨 [SELL] Mutation error callback:', error);
      
      // Логируем ошибку мутации
      await SecurityMonitor.logSuspiciousActivity(
        variables.userId, 
        'sell_mutation_error', 
        { error: error.message, inventoryId: variables.inventoryId },
        'medium'
      );

      toast({
        title: "Ошибка продажи",
        description: enhancedValidation.sanitizeString(error.message || "Не удалось продать скин"),
        variant: "destructive",
      });
    }
  });
};
