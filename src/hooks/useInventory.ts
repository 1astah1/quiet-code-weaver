
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
        // Проверяем аутентификацию перед запросом
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session || session.user.id !== userId) {
          console.error('User not authenticated or ID mismatch');
          return [];
        }

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
          throw error;
        }
        
        console.log('Inventory loaded:', data?.length || 0, 'items');
        return (data || []) as InventoryItem[];
      } catch (error) {
        console.error('Inventory query error:', error);
        return [];
      }
    },
    enabled: !!userId && isValidUUID(userId),
    retry: 2
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
        console.log('Selling skin:', { inventoryId, userId, sellPrice });
        
        // Проверяем валидность UUID
        if (!isValidUUID(userId) || !isValidUUID(inventoryId)) {
          throw new Error('Ошибка идентификации. Пожалуйста, перезагрузите страницу.');
        }

        // Проверяем существование пользователя
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

        const currentCoins = userData.coins || 0;
        const newCoins = currentCoins + sellPrice;
        
        console.log('Current coins:', currentCoins, 'Adding:', sellPrice, 'New total:', newCoins);

        // Проверяем существование предмета в инвентаре
        const { data: inventoryItem, error: inventoryCheckError } = await supabase
          .from('user_inventory')
          .select('id, user_id, is_sold')
          .eq('id', inventoryId)
          .eq('user_id', userId)
          .eq('is_sold', false)
          .single();

        if (inventoryCheckError) {
          console.error('Error checking inventory item:', inventoryCheckError);
          if (inventoryCheckError.code === 'PGRST116') {
            throw new Error('Предмет не найден в инвентаре');
          }
          throw new Error('Ошибка проверки инвентаря');
        }

        // Обновляем монеты пользователя
        const { error: coinsError } = await supabase
          .from('users')
          .update({ coins: newCoins })
          .eq('id', userId);

        if (coinsError) {
          console.error('Error updating coins:', coinsError);
          throw new Error('Не удалось обновить баланс');
        }

        // Помечаем скин как проданный
        const { error: sellError } = await supabase
          .from('user_inventory')
          .update({
            is_sold: true,
            sold_at: new Date().toISOString(),
            sold_price: sellPrice
          })
          .eq('id', inventoryId)
          .eq('user_id', userId);

        if (sellError) {
          console.error('Error marking skin as sold:', sellError);
          // Откатываем изменение баланса
          await supabase
            .from('users')
            .update({ coins: currentCoins })
            .eq('id', userId);
          throw new Error('Не удалось продать скин');
        }

        console.log('Skin sold successfully, new coins:', newCoins);
        return { newCoins };
      } catch (error) {
        console.error('Sell skin error:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-inventory', variables.userId] });
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
