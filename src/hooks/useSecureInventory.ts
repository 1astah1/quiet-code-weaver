
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityRateLimiter, auditLog, validateInput } from "@/utils/security";
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

export const useSecureUserInventory = (userId: string) => {
  return useQuery({
    queryKey: ['user-inventory', userId],
    queryFn: async () => {
      if (!isValidUUID(userId)) {
        console.error('Invalid user ID format:', userId);
        throw new Error('Invalid user ID');
      }

      try {
        console.log('Loading inventory for user:', userId);

        const { data, error } = await supabase
          .from('user_inventory')
          .select(`
            *,
            skins (*)
          `)
          .eq('user_id', userId)
          .eq('is_sold', false)
          .order('obtained_at', { ascending: false });
        
        if (error) {
          console.error('Error loading inventory:', error);
          await auditLog(userId, 'inventory_load_failed', { error: error.message }, false);
          throw error;
        }
        
        console.log('Inventory loaded:', data?.length || 0, 'items');
        await auditLog(userId, 'inventory_loaded', { itemCount: data?.length || 0 });
        return (data || []) as InventoryItem[];
      } catch (error) {
        console.error('Inventory query error:', error);
        return [];
      }
    },
    enabled: !!userId && isValidUUID(userId),
    retry: 2,
    refetchOnWindowFocus: false, // Уменьшаем частоту обновлений
    refetchInterval: 30000, // Увеличиваем интервал до 30 секунд
    staleTime: 10000 // Увеличиваем время устаревания
  });
};

export const useSecureSellSkin = () => {
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
      // Проверка rate limiting
      if (!SecurityRateLimiter.canPerformAction(userId, 'sell_skin')) {
        const remaining = SecurityRateLimiter.getRemainingTime(userId, 'sell_skin');
        throw new Error(`Слишком много попыток продажи. Попробуйте через ${Math.ceil(remaining / 1000)} секунд`);
      }

      // Валидация данных
      if (!isValidUUID(userId) || !isValidUUID(inventoryId)) {
        await auditLog(userId, 'sell_skin_invalid_id', { inventoryId, userId }, false);
        throw new Error('Ошибка идентификации. Пожалуйста, перезагрузите страницу.');
      }

      if (!validateInput.skinPrice(sellPrice)) {
        await auditLog(userId, 'sell_skin_invalid_price', { sellPrice }, false);
        throw new Error('Недопустимая цена скина');
      }

      try {
        console.log('Starting secure sell process:', { inventoryId, userId, sellPrice });
        
        // Используем безопасную функцию продажи из базы данных
        const { data, error } = await supabase.rpc('safe_sell_skin', {
          p_user_id: userId,
          p_inventory_id: inventoryId,
          p_sell_price: sellPrice
        });

        if (error) {
          console.error('Error selling skin:', error);
          await auditLog(userId, 'sell_skin_failed', { error: error.message, inventoryId, sellPrice }, false);
          throw new Error(error.message || 'Не удалось продать скин');
        }

        await auditLog(userId, 'sell_skin_success', { inventoryId, sellPrice });
        console.log('Skin sold successfully');
        return { newCoins: data };
      } catch (error) {
        console.error('Sell skin error:', error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      console.log('Sell successful, invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] });
      
      toast({
        title: "Скин продан!",
        description: `Получено ${variables.sellPrice} монет`,
      });
      return data.newCoins;
    },
    onError: (error: any) => {
      console.error('Sell skin mutation error:', error);
      toast({
        title: "Ошибка продажи",
        description: error.message || "Не удалось продать скин",
        variant: "destructive",
      });
    }
  });
};
