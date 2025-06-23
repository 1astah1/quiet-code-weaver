
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { enhancedValidation, SecurityMonitor, secureOperation } from "@/utils/securityEnhanced";
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

  // Проверяем является ли пользователь администратором
  const isAdmin = currentUser.is_admin || false;

  const purchaseMutation = useMutation({
    mutationFn: async (skin: Skin) => {
      console.log('🛒 [SECURE_SHOP] Starting secure purchase:', { 
        skinName: skin.name, 
        skinPrice: skin.price, 
        userCoins: currentUser.coins, 
        userId: currentUser.id,
        isAdmin 
      });

      // ИСПРАВЛЕНО: Администраторы пропускают проверки безопасности
      if (isAdmin) {
        console.log('👑 [SECURE_SHOP] Admin user detected, bypassing security checks');
        
        // Прямой вызов RPC для администраторов
        const { data, error } = await supabase.rpc('safe_purchase_skin', {
          p_user_id: currentUser.id,
          p_skin_id: skin.id,
          p_skin_price: skin.price
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

      // Для обычных пользователей выполняем полные проверки безопасности
      return await secureOperation(
        async () => {
          // Валидация входных данных
          if (!enhancedValidation.uuid(currentUser.id)) {
            throw new Error('Ошибка пользователя. Пожалуйста, перезагрузите страницу.');
          }

          if (!enhancedValidation.uuid(skin.id)) {
            throw new Error('Ошибка скина. Пожалуйста, попробуйте снова.');
          }

          if (!enhancedValidation.skinPrice(skin.price)) {
            throw new Error('Некорректная цена скина.');
          }

          if (currentUser.coins < skin.price) {
            throw new Error(`Недостаточно монет. Нужно ${skin.price}, у вас ${currentUser.coins}`);
          }

          // Проверка rate limit
          if (!SecurityMonitor.checkClientRateLimit(currentUser.id, 'purchase_skin', 3)) {
            throw new Error('Слишком много покупок. Подождите немного.');
          }

          // Проверяем на аномальную активность
          if (SecurityMonitor.detectAnomalousActivity(currentUser.id, 'purchase', skin.price)) {
            throw new Error('Обнаружена подозрительная активность.');
          }

          console.log('📡 [SECURE_SHOP] Calling RPC function...');

          // Используем RPC функцию с проверкой аутентификации
          const { data, error } = await supabase.rpc('safe_purchase_skin', {
            p_user_id: currentUser.id,
            p_skin_id: skin.id,
            p_skin_price: skin.price
          });

          if (error) {
            console.error('❌ [SECURE_SHOP] RPC purchase error:', error);
            
            // Логируем подозрительную активность при ошибках
            await SecurityMonitor.logSuspiciousActivity(
              currentUser.id, 
              'purchase_error', 
              { error: error.message, skinId: skin.id, price: skin.price },
              'medium'
            );
            
            throw new Error(error.message || 'Не удалось совершить покупку');
          }

          // Безопасно приводим тип
          const response = data as unknown as SafePurchaseSkinResponse;
          
          if (!response?.success) {
            const errorMsg = response?.error || 'Покупка не удалась';
            
            // Логируем неудачную покупку
            await SecurityMonitor.logSuspiciousActivity(
              currentUser.id, 
              'purchase_failed', 
              { error: errorMsg, skinId: skin.id, price: skin.price },
              'low'
            );
            
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
        currentUser.id,
        'purchase_skin',
        { skinId: skin.id, price: skin.price }
      );
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
        description: `${enhancedValidation.sanitizeString(data.purchasedSkin.name)} добавлен в инвентарь (${userType})`,
      });

      return data;
    },
    onError: async (error: any) => {
      console.error('🚨 [SECURE_SHOP] Purchase error:', error);
      
      // Логируем ошибку покупки только для не-админов
      if (!isAdmin) {
        await SecurityMonitor.logSuspiciousActivity(
          currentUser.id, 
          'purchase_mutation_error', 
          { error: error.message },
          'medium'
        );
      }

      toast({
        title: "Ошибка покупки",
        description: enhancedValidation.sanitizeString(error.message || "Не удалось совершить покупку"),
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
