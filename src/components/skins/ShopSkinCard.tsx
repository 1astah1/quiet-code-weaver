
import React from 'react';
import { Button } from '@/components/ui/button';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface Skin {
  id: string;
  name: string;
  weapon_type: string;
  rarity: string;
  price: number;
  image_url: string | null;
}

interface ShopSkinCardProps {
  skin: Skin;
  canAfford: boolean;
  onPurchase: (skin: Skin) => void;
  isPurchasing: boolean;
}

const ShopSkinCard: React.FC<ShopSkinCardProps> = ({ 
  skin, 
  canAfford, 
  onPurchase, 
  isPurchasing 
}) => {
  const getRarityColor = (rarity: string) => {
    const colors = {
      'Covert': 'from-orange-500 to-red-500',
      'Classified': 'from-red-500 to-pink-500',
      'Restricted': 'from-purple-500 to-pink-500',
      'Mil-Spec': 'from-blue-500 to-purple-500',
      'Industrial Grade': 'from-blue-400 to-blue-600',
      'Consumer Grade': 'from-gray-500 to-gray-600',
    };
    return colors[rarity as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const handlePurchaseClick = () => {
    if (!isPurchasing && canAfford) {
      console.log('🛒 [SHOP_SKIN_CARD] Purchase initiated for:', skin.name);
      onPurchase(skin);
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getRarityColor(skin.rarity)} p-0.5 rounded-lg hover:scale-105 transition-transform duration-200`}>
      <div className="bg-slate-900 rounded-lg p-2 sm:p-3 h-full flex flex-col">
        <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-slate-800">
          <OptimizedImage
            src={skin.image_url}
            alt={skin.name}
            className="w-full h-full object-cover"
            fallback={
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <div className="text-xl mb-1">🎯</div>
                  <div className="text-xs">Нет фото</div>
                </div>
              </div>
            }
            onError={() => {
              console.warn('🖼️ [SHOP_SKIN_CARD] Image failed for skin:', skin.name);
            }}
          />
        </div>
        
        <div className="flex-1 flex flex-col">
          <h3 className="text-white font-semibold text-xs sm:text-sm mb-1 line-clamp-2 leading-tight" title={skin.name}>
            {skin.name}
          </h3>
          
          <p className="text-slate-400 text-xs mb-1 truncate" title={skin.weapon_type}>
            {skin.weapon_type}
          </p>
          
          <p className="text-xs text-slate-500 mb-2 capitalize">
            {skin.rarity}
          </p>
          
          <div className="mt-auto">
            <div className="text-yellow-400 font-bold text-sm mb-2 text-center">
              {skin.price}₽
            </div>
            
            <Button
              onClick={handlePurchaseClick}
              disabled={!canAfford || isPurchasing}
              size="sm"
              className={`w-full text-xs transition-all duration-200 ${
                canAfford 
                  ? 'bg-green-600 hover:bg-green-700 active:bg-green-800' 
                  : 'bg-gray-600 cursor-not-allowed opacity-60'
              }`}
            >
              {isPurchasing ? (
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Покупка...</span>
                </div>
              ) : canAfford ? (
                'Купить'
              ) : (
                'Мало монет'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopSkinCard;
