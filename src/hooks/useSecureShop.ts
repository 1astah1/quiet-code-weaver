import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEnhancedSecurity } from "@/hooks/useEnhancedSecurity";
import type { SafePurchaseSkinResponse } from "@/types/rpc";

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

export const useSecureShop = (currentUser: CurrentUser) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    checkRateLimit, 
    validateInput, 
    sanitizeString, 
    logSuspiciousActivity,
    isAdmin 
  } = useEnhancedSecurity(currentUser);

  const purchaseMutation = useMutation({
    mutationFn: async (skin: Skin) => {
      console.log('🛒 [SECURE_SHOP] Starting secure purchase:', { 
        skinName: skin.name, 
        skinPrice: skin.price, 
        userCoins: currentUser.coins, 
        userId: currentUser.id,
        isAdmin 
      });

      // Для администраторов упрощенный процесс
      if (isAdmin) {
        console.log('👑 [SECURE_SHOP] Admin user detected, bypassing most security checks');
        
        const { data, error } = await (supabase.rpc as any)('purchase_skin', {
          p_user_id: currentUser.id,
          p_skin_id: skin.id
        });

        if (error) {
          console.error('❌ [SECURE_SHOP] Admin RPC purchase error:', error);
          throw new Error(error.message || 'Не удалось совершить покупку');
        }

        const response = data as unknown as SafePurchaseSkinResponse;
        
        if (!response?.success) {
          const errorMsg = response?.error || 'Покупка не удалась';
          throw new Error(errorMsg);
        }

        return { 
          newCoins: response.new_balance!, 
          purchasedSkin: skin,
          inventoryId: response.inventory_id!
        };
      }

      // Для обычных пользователей полные проверки
      // Валидация входных данных
      if (!validateInput(currentUser.id, 'uuid')) {
        throw new Error('Ошибка пользователя. Пожалуйста, перезагрузите страницу.');
      }

      if (!validateInput(skin.id, 'uuid')) {
        throw new Error('Ошибка скина. Пожалуйста, попробуйте снова.');
      }

      if (!validateInput(skin.price, 'coins')) {
        throw new Error('Некорректная цена скина.');
      }

      if (currentUser.coins < skin.price) {
        throw new Error(`Недостаточно монет. Нужно ${skin.price}, у вас ${currentUser.coins}`);
      }

      // Проверка rate limit с более мягкими ограничениями
      const canProceed = await checkRateLimit('purchase_skin', 5, 10); // 5 покупок за 10 минут
      if (!canProceed) {
        throw new Error('Слишком много покупок. Подождите немного перед следующей покупкой.');
      }

      console.log('📡 [SECURE_SHOP] Calling RPC function...');

      const { data, error } = await (supabase.rpc as any)('purchase_skin', {
        p_user_id: currentUser.id,
        p_skin_id: skin.id
      });

      if (error) {
        console.error('❌ [SECURE_SHOP] RPC purchase error:', error);
        
        // Логируем подозрительную активность при ошибках
        await logSuspiciousActivity('purchase_error', {
          error: error.message,
          skinId: skin.id,
          price: skin.price
        });
        
        throw new Error(error.message || 'Не удалось совершить покупку');
      }

      const response = data as unknown as SafePurchaseSkinResponse;
      
      if (!response?.success) {
        const errorMsg = response?.error || 'Покупка не удалась';
        
        await logSuspiciousActivity('purchase_failed', {
          error: errorMsg,
          skinId: skin.id,
          price: skin.price
        });
        
        throw new Error(errorMsg);
      }

      console.log('✅ [SECURE_SHOP] Purchase successful:', {
        newBalance: response.new_balance,
        inventoryId: response.inventory_id
      });

      return { 
        newCoins: response.new_balance!, 
        purchasedSkin: skin,
        inventoryId: response.inventory_id!
      };
    },
    onSuccess: async (data) => {
      console.log('🎉 [SECURE_SHOP] Purchase completed successfully');
      
      // Инвалидируем кэш инвентаря
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] }),
        queryClient.refetchQueries({ queryKey: ['user-inventory', currentUser.id] })
      ]);
      
      const userType = isAdmin ? 'администратор' : 'покупатель';
      toast({
        title: "Покупка успешна!",
        description: `${sanitizeString(data.purchasedSkin.name)} добавлен в инвентарь (${userType})`,
      });

      return data;
    },
    onError: async (error: any) => {
      console.error('🚨 [SECURE_SHOP] Purchase error:', error);
      
      // Логируем ошибку покупки только для не-админов
      if (!isAdmin) {
        await logSuspiciousActivity('purchase_mutation_error', {
          error: error.message
        });
      }

      toast({
        title: "Ошибка покупки",
        description: sanitizeString(error.message || "Не удалось совершить покупку"),
        variant: "destructive",
      });
    }
  });

  return {
    purchaseMutation,
    isPurchasing: purchaseMutation.isPending,
    isAdmin
  };
};
