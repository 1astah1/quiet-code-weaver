
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
      'Covert': 'from-orange-500 to-red-500',
      'Classified': 'from-red-500 to-pink-500',
      'Restricted': 'from-purple-500 to-pink-500',
      'Mil-Spec': 'from-blue-500 to-purple-500',
      'Industrial': 'from-blue-400 to-blue-600',
      'Consumer': 'from-gray-500 to-gray-600',
    };
    return colors[rarity as keyof typeof colors] || 'from-gray-500 to-gray-600';
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
      <div className="min-h-screen pb-20 px-4 pt-4">
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
      <div className="min-h-screen pb-20 px-4 pt-4">
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
    <div className="min-h-screen pb-20 px-4 pt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Мои выигрыши</h1>
        <p className="text-slate-400">Управляйте своими скинами</p>
      </div>

      {!inventory || inventory.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Ваш инвентарь пуст</p>
          <p className="text-slate-500 text-sm">Откройте кейсы, чтобы получить скины</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item) => (
            <div
              key={item.id}
              className={`bg-gradient-to-br ${getRarityColor(item.skins.rarity)} rounded-xl p-4 border border-slate-700/50 relative overflow-hidden`}
            >
              {/* Rarity Badge */}
              <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                {item.skins.rarity}
              </div>

              {/* Skin Image with Lazy Loading */}
              <div className="bg-black/30 rounded-lg h-32 mb-4 flex items-center justify-center">
                {item.skins.image_url ? (
                  <LazyImage
                    src={item.skins.image_url}
                    alt={item.skins.name}
                    className="w-full h-full object-cover rounded-lg"
                    fallback={<Package className="w-12 h-12 text-white/50" />}
                  />
                ) : (
                  <Package className="w-12 h-12 text-white/50" />
                )}
              </div>

              {/* Skin Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-white font-bold text-sm">{item.skins.name}</h3>
                  <p className="text-white/80 text-xs">{item.skins.weapon_type}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span className="text-sm font-bold">{item.skins.price}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleSellSkin(item.id, item.skins.price)}
                    disabled={sellSkinMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1"
                  >
                    <Coins className="w-3 h-3" />
                    <span>
                      {sellSkinMutation.isPending ? "Продажа..." : `Продать за ${item.skins.price}`}
                    </span>
                  </button>
                  
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>Вывести в Steam</span>
                  </button>
                </div>
              </div>

              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryScreen;
