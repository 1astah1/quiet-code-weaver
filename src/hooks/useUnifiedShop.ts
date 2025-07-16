import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/toast';
import { clientRateLimit } from '@/utils/simpleRateLimit';

interface Skin {
  id: string;
  name: string;
  weapon_type: string;
  rarity: string;
  price: number;
  image_url: string | null;
}

interface CurrentUser {
  id: string;
  coins: number;
  is_admin?: boolean;
}

// Централизованный хук для управления балансом
export const useBalanceManager = (userId: string) => {
  const queryClient = useQueryClient();

  const syncBalance = useCallback(async (): Promise<number> => {
    console.log('💰 [BALANCE] Syncing balance from database...');
    
    const { data, error } = await supabase
      .from('users')
      .select('coins')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [BALANCE] Failed to sync:', error);
      throw error;
    }

    const newBalance = data.coins || 0;
    
    // Обновляем кэш
    queryClient.setQueryData(['user-balance', userId], newBalance);
    
    console.log('✅ [BALANCE] Synced:', newBalance);
    return newBalance;
  }, [userId, queryClient]);

  const updateBalance = useCallback((newBalance: number) => {
    console.log('💰 [BALANCE] Updating balance to:', newBalance);
    queryClient.setQueryData(['user-balance', userId], newBalance);
  }, [userId, queryClient]);

  return { syncBalance, updateBalance };
};

// Унифицированный хук для покупок
export const useUnifiedPurchase = (currentUser: CurrentUser, onCoinsUpdate: (coins: number) => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { syncBalance } = useBalanceManager(currentUser.id);
  const purchaseInProgress = useRef(false);

  const purchaseMutation = useMutation({
    mutationFn: async (skin: Skin) => {
      // Предотвращаем двойные покупки
      if (purchaseInProgress.current) {
        throw new Error('Покупка уже выполняется');
      }

      // Rate limiting (мягкие лимиты)
      const rateLimitKey = `purchase_${currentUser.id}`;
      if (!currentUser.is_admin && !clientRateLimit.checkLimit(rateLimitKey, 10, 60000)) {
        throw new Error('Слишком частые покупки. Подождите немного.');
      }

      purchaseInProgress.current = true;

      console.log('🛒 [PURCHASE] Starting purchase:', {
        skinName: skin.name,
        price: skin.price,
        userCoins: currentUser.coins,
        isAdmin: currentUser.is_admin
      });

      // Проверка баланса
      if (currentUser.coins < skin.price && !currentUser.is_admin) {
        throw new Error(`Недостаточно монет. Нужно ${skin.price}, у вас ${currentUser.coins}`);
      }

      // Вызов RPC функции
      const { data, error } = await supabase.rpc('purchase_skin', {
        p_user_id: currentUser.id,
        p_skin_id: skin.id
      });

      if (error) {
        console.error('❌ [PURCHASE] RPC error:', error);
        throw new Error(error.message || 'Не удалось совершить покупку');
      }

      const response = data as any;
      
      if (!response?.success) {
        throw new Error(response?.error || 'Покупка не удалась');
      }

      console.log('✅ [PURCHASE] Success:', response);

      return {
        newBalance: response.new_balance,
        inventoryId: response.inventory_id,
        skin
      };
    },
    onSuccess: async (data) => {
      purchaseInProgress.current = false;
      
      // Обновляем баланс через callback
      onCoinsUpdate(data.newBalance);
      
      // Инвалидируем кэши
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] }),
        queryClient.invalidateQueries({ queryKey: ['user-balance', currentUser.id] })
      ]);

      toast({
        title: "Покупка успешна!",
        description: `${data.skin.name} добавлен в инвентарь`,
      });
    },
    onError: (error: any) => {
      purchaseInProgress.current = false;
      
      console.error('🚨 [PURCHASE] Error:', error);
      
      toast({
        title: "Ошибка покупки",
        description: error.message || "Не удалось совершить покупку",
        variant: "destructive",
      });
    }
  });

  return {
    purchaseMutation,
    isPurchasing: purchaseMutation.isPending
  };
};

// Унифицированный хук для продаж
export const useUnifiedSale = (currentUser: CurrentUser, onCoinsUpdate: (coins: number) => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { syncBalance } = useBalanceManager(currentUser.id);
  const sellInProgress = useRef(false);

  const sellMutation = useMutation({
    mutationFn: async (inventoryItemId: string) => {
      // Предотвращаем двойные продажи
      if (sellInProgress.current) {
        throw new Error('Продажа уже выполняется');
      }

      // Rate limiting
      const rateLimitKey = `sell_${currentUser.id}`;
      if (!currentUser.is_admin && !clientRateLimit.checkLimit(rateLimitKey, 10, 30000)) {
        throw new Error('Слишком частые продажи. Подождите немного.');
      }

      sellInProgress.current = true;

      console.log('💰 [SELL] Starting sale:', {
        inventoryItemId,
        userId: currentUser.id
      });

      // Вызов RPC функции
      const { data, error } = await supabase.rpc('final_sell_item', {
        p_inventory_id: inventoryItemId,
        p_user_id: currentUser.id
      });

      if (error) {
        console.error('❌ [SELL] RPC error:', error);
        throw new Error(error.message || 'Не удалось продать скин');
      }

      if (!data || data.length === 0) {
        throw new Error('Сервер не вернул результат операции');
      }

      const result = data[0];

      if (!result.success) {
        throw new Error(result.message || 'Продажа не удалась');
      }

      console.log('✅ [SELL] Success:', result);

      return {
        newBalance: result.new_balance,
        inventoryItemId
      };
    },
    onSuccess: async (data) => {
      sellInProgress.current = false;
      
      // Обновляем баланс через callback
      onCoinsUpdate(data.newBalance);
      
      // Инвалидируем кэши
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] }),
        queryClient.invalidateQueries({ queryKey: ['user-balance', currentUser.id] })
      ]);

      toast({
        title: "Продажа успешна!",
        description: "Скин продан, баланс обновлен",
      });
    },
    onError: (error: any) => {
      sellInProgress.current = false;
      
      console.error('🚨 [SELL] Error:', error);
      
      // Принудительно обновляем инвентарь при ошибке
      queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
      
      toast({
        title: "Ошибка продажи",
        description: error.message || "Не удалось продать скин",
        variant: "destructive",
      });
    }
  });

  return {
    sellMutation,
    isSelling: sellMutation.isPending
  };
};

// Хук для загрузки инвентаря
export const useUnifiedInventory = (userId: string) => {
  return useQuery({
    queryKey: ['user-inventory', userId],
    queryFn: async () => {
      console.log('📦 [INVENTORY] Loading inventory for user:', userId);

      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          *,
          skins (
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
        console.error('❌ [INVENTORY] Error:', error);
        throw error;
      }

      console.log('✅ [INVENTORY] Loaded:', data?.length || 0, 'items');
      return data || [];
    },
    refetchOnWindowFocus: false,
    staleTime: 10000, // 10 секунд
    retry: 2
  });
};