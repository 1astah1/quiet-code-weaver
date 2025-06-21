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
      if (!isValidUUID(userId)) {
        console.error('Invalid user ID format:', userId);
        return [];
      }

      try {
        console.log('Loading inventory for user:', userId);

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
        
        if (error) {
          console.error('Error loading inventory:', error);
          throw error;
        }
        
        console.log('Raw inventory data loaded:', data);
        
        // Проверяем и логируем каждый элемент инвентаря
        const inventoryItems = (data || []).map(item => {
          console.log('Processing inventory item:', {
            id: item.id,
            skinData: item.skins,
            hasImage: !!item.skins?.image_url,
            imageUrl: item.skins?.image_url
          });
          return item;
        });
        
        console.log('Processed inventory items:', inventoryItems.length, 'items');
        return inventoryItems as InventoryItem[];
      } catch (error) {
        console.error('Inventory query error:', error);
        return [];
      }
    },
    enabled: !!userId && isValidUUID(userId),
    retry: 2,
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
        console.log('Starting sell process:', { inventoryId, userId, sellPrice });
        
        if (!isValidUUID(userId) || !isValidUUID(inventoryId)) {
          throw new Error('Ошибка идентификации. Пожалуйста, перезагрузите страницу.');
        }

        // Проверяем существование пользователя и получаем его текущий баланс
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, coins')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error getting user:', userError);
          if (userError.code === 'PGRST116') {
            throw new Error('Пользователь не найден');
          }
          throw new Error('Не удалось получить данные пользователя');
        }

        console.log('User data found:', userData);

        // Проверяем существование предмета в инвентаре
        const { data: inventoryItem, error: inventoryCheckError } = await supabase
          .from('user_inventory')
          .select('*')
          .eq('id', inventoryId)
          .eq('user_id', userId)
          .eq('is_sold', false)
          .single();

        if (inventoryCheckError) {
          console.error('Error checking inventory item:', inventoryCheckError);
          if (inventoryCheckError.code === 'PGRST116') {
            throw new Error('Предмет не найден в инвентаре или уже продан');
          }
          throw new Error('Ошибка проверки инвентаря');
        }

        console.log('Inventory item found:', inventoryItem);

        const currentCoins = userData.coins || 0;
        const newCoins = currentCoins + sellPrice;
        
        console.log('Coin calculation - Current:', currentCoins, 'Adding:', sellPrice, 'New total:', newCoins);

        // Начинаем транзакцию: сначала помечаем предмет как проданный
        const { error: sellError } = await supabase
          .from('user_inventory')
          .update({
            is_sold: true,
            sold_at: new Date().toISOString(),
            sold_price: sellPrice
          })
          .eq('id', inventoryId)
          .eq('user_id', userId)
          .eq('is_sold', false); // Дополнительная проверка

        if (sellError) {
          console.error('Error marking skin as sold:', sellError);
          throw new Error('Не удалось продать скин');
        }

        console.log('Item marked as sold successfully');

        // Затем обновляем баланс пользователя
        const { error: coinsError } = await supabase
          .from('users')
          .update({ coins: newCoins })
          .eq('id', userId);

        if (coinsError) {
          console.error('Error updating coins:', coinsError);
          // Откатываем продажу предмета
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

        console.log('Coins updated successfully to:', newCoins);
        return { newCoins };
      } catch (error) {
        console.error('Sell skin error:', error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      console.log('Sell successful, invalidating queries...');
      // Принудительно обновляем инвентарь
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] });
      await queryClient.refetchQueries({ queryKey: ['user-inventory', variables.userId] });
      
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
