import { useUnifiedPurchase, useUnifiedSale, useUnifiedInventory } from '@/hooks/useUnifiedShop';
import { clientRateLimit } from '@/utils/simpleRateLimit';

// Тестирование и диагностика системы покупок/продаж
export const useShopDiagnostics = (currentUser: any, onCoinsUpdate: (coins: number) => void) => {
  const { purchaseMutation, isPurchasing } = useUnifiedPurchase(currentUser, onCoinsUpdate);
  const { sellMutation, isSelling } = useUnifiedSale(currentUser, onCoinsUpdate);
  const { data: inventory } = useUnifiedInventory(currentUser.id);

  // Диагностика rate limiting
  const diagnosticRateLimit = () => {
    console.log('🔍 [DIAGNOSTICS] Testing rate limits...');
    
    const purchaseKey = `purchase_${currentUser.id}`;
    const sellKey = `sell_${currentUser.id}`;
    
    console.log('Purchase rate limit check:', clientRateLimit.checkLimit(purchaseKey, 1, 1000));
    console.log('Sell rate limit check:', clientRateLimit.checkLimit(sellKey, 1, 1000));
  };

  // Тестовая покупка
  const testPurchase = async (skinId: string) => {
    console.log('🧪 [TEST] Starting test purchase...');
    
    const testSkin = {
      id: skinId,
      name: 'Test Skin',
      weapon_type: 'AK-47',
      rarity: 'Covert',
      price: 10,
      image_url: null
    };

    try {
      const result = await purchaseMutation.mutateAsync(testSkin);
      console.log('✅ [TEST] Purchase successful:', result);
      return result;
    } catch (error) {
      console.error('❌ [TEST] Purchase failed:', error);
      throw error;
    }
  };

  // Тестовая продажа
  const testSale = async (inventoryItemId: string) => {
    console.log('🧪 [TEST] Starting test sale...');
    
    try {
      const result = await sellMutation.mutateAsync(inventoryItemId);
      console.log('✅ [TEST] Sale successful:', result);
      return result;
    } catch (error) {
      console.error('❌ [TEST] Sale failed:', error);
      throw error;
    }
  };

  // Полная диагностика системы
  const runFullDiagnostics = () => {
    console.group('🔧 [FULL DIAGNOSTICS] Starting comprehensive check...');
    
    console.log('User info:', {
      id: currentUser.id,
      coins: currentUser.coins,
      isAdmin: currentUser.is_admin
    });
    
    console.log('Inventory items count:', inventory?.length || 0);
    console.log('Purchase mutation state:', { isPending: isPurchasing });
    console.log('Sale mutation state:', { isPending: isSelling });
    
    diagnosticRateLimit();
    
    console.groupEnd();
  };

  // Очистка rate limits (для администраторов)
  const clearRateLimits = () => {
    if (currentUser.is_admin) {
      console.log('🧹 [ADMIN] Clearing rate limits...');
      clientRateLimit.bypass(`purchase_${currentUser.id}`);
      clientRateLimit.bypass(`sell_${currentUser.id}`);
      console.log('✅ [ADMIN] Rate limits cleared');
    }
  };

  return {
    testPurchase,
    testSale,
    runFullDiagnostics,
    clearRateLimits,
    diagnosticRateLimit,
    isPurchasing,
    isSelling,
    inventoryCount: inventory?.length || 0
  };
};