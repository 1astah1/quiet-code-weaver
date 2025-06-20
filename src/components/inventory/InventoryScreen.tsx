
import { useState } from "react";
import { useUserInventory, useSellSkin } from "@/hooks/useInventory";
import { Package, Coins, ExternalLink, Loader2 } from "lucide-react";
import LazyImage from "@/components/ui/LazyImage";
import { inventoryLimiter } from "@/utils/rateLimiter";
import { useToast } from "@/hooks/use-toast";

interface InventoryScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const InventoryScreen = ({ currentUser, onCoinsUpdate }: InventoryScreenProps) => {
  const { data: inventory, isLoading, error } = useUserInventory(currentUser.id);
  const sellSkinMutation = useSellSkin();
  const { toast } = useToast();

  const getRarityColor = (rarity: string) => {
    const colors = {
      'Covert': 'border-orange-500 bg-orange-500/10',
      'Classified': 'border-red-500 bg-red-500/10',
      'Restricted': 'border-purple-500 bg-purple-500/10',
      'Mil-Spec': 'border-blue-500 bg-blue-500/10',
      'Industrial Grade': 'border-blue-400 bg-blue-400/10',
      'Consumer Grade': 'border-gray-500 bg-gray-500/10',
    };
    return colors[rarity as keyof typeof colors] || 'border-gray-500 bg-gray-500/10';
  };

  const handleSellSkin = async (inventoryId: string, sellPrice: number) => {
    try {
      // Проверка rate limiting
      if (!inventoryLimiter.isAllowed(currentUser.id)) {
        toast({
          title: "Слишком много операций",
          description: "Подождите немного перед следующей продажей",
          variant: "destructive",
        });
        return;
      }

      console.log('Selling skin from inventory:', inventoryId, 'for', sellPrice);
      if (sellSkinMutation.isPending) {
        console.log('Sell already in progress');
        return;
      }
      
      const result = await sellSkinMutation.mutateAsync({
        inventoryId,
        userId: currentUser.id,
        sellPrice
      });
      
      if (result && result.newCoins !== undefined) {
        console.log('Skin sold, updating coins to:', result.newCoins);
        onCoinsUpdate(result.newCoins);
      }
    } catch (error) {
      console.error('Error selling skin:', error);
      // Ошибка уже обработана в мутации
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 px-2 sm:px-4 pt-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-slate-400">Загрузка инвентаря...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-20 px-2 sm:px-4 pt-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 text-lg">Ошибка загрузки инвентаря</p>
            <p className="text-slate-500 text-sm">Попробуйте перезагрузить страницу</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-2 sm:px-4 pt-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Мои выигрыши</h1>
        <p className="text-slate-400 text-sm sm:text-base">Управляйте своими скинами</p>
      </div>

      {!inventory || inventory.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 sm:w-16 h-12 sm:h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 text-base sm:text-lg">Ваш инвентарь пуст</p>
          <p className="text-slate-500 text-xs sm:text-sm">Откройте кейсы, чтобы получить скины</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {inventory.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-800/50 rounded-lg border ${getRarityColor(item.skins.rarity)} p-2 sm:p-3 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl`}
            >
              {/* Rarity Badge */}
              <div className="bg-black/60 px-1.5 py-0.5 rounded text-xs text-white mb-2 text-center truncate">
                {item.skins.rarity.split(' ')[0]}
              </div>

              {/* Skin Image with Lazy Loading */}
              <div className="bg-black/30 rounded-lg aspect-square mb-2 flex items-center justify-center overflow-hidden">
                {item.skins.image_url ? (
                  <LazyImage
                    src={item.skins.image_url}
                    alt={item.skins.name}
                    className="w-full h-full object-contain"
                    fallback={<Package className="w-6 sm:w-8 h-6 sm:h-8 text-white/50" />}
                  />
                ) : (
                  <Package className="w-6 sm:w-8 h-6 sm:h-8 text-white/50" />
                )}
              </div>

              {/* Skin Info */}
              <div className="space-y-1.5 sm:space-y-2">
                <div>
                  <h3 className="text-white font-semibold text-xs leading-tight truncate" title={item.skins.name}>
                    {item.skins.name}
                  </h3>
                  <p className="text-white/70 text-xs truncate">{item.skins.weapon_type}</p>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">₽</span>
                    </div>
                    <span className="text-orange-400 font-bold text-xs">{item.skins.price}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleSellSkin(item.id, item.skins.price)}
                    disabled={sellSkinMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-2 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center space-x-1"
                  >
                    {sellSkinMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Coins className="w-3 h-3" />
                        <span className="hidden sm:inline">Продать</span>
                        <span className="sm:hidden">₽</span>
                      </>
                    )}
                  </button>
                  
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center space-x-1">
                    <ExternalLink className="w-3 h-3" />
                    <span className="hidden sm:inline">Steam</span>
                    <span className="sm:hidden">↗</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryScreen;
