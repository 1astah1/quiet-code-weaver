
import { Package, Coins, ShoppingCart } from "lucide-react";

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
  isPurchasing?: boolean;
}

const ShopSkinCard = ({ skin, canAfford, onPurchase, isPurchasing = false }: ShopSkinCardProps) => {
  const rarityColors = {
    'Consumer': 'from-gray-600 to-gray-700',
    'Industrial': 'from-blue-600 to-blue-700',
    'Mil-Spec': 'from-purple-600 to-purple-700',
    'Restricted': 'from-pink-600 to-pink-700',
    'Classified': 'from-red-600 to-red-700',
    'Covert': 'from-orange-600 to-orange-700',
    'Contraband': 'from-yellow-600 to-yellow-700',
  };

  const handleClick = () => {
    console.log('Shop card clicked:', skin.name, 'canAfford:', canAfford, 'isPurchasing:', isPurchasing);
    if (isPurchasing) {
      console.log('Purchase already in progress, ignoring click');
      return;
    }
    if (!canAfford) {
      console.log('Cannot afford this skin');
      return;
    }
    onPurchase(skin);
  };

  const isDisabled = !canAfford || isPurchasing;

  return (
    <div
      className={`bg-gradient-to-br ${rarityColors[skin.rarity as keyof typeof rarityColors] || 'from-gray-600 to-gray-700'} rounded-lg p-4 border border-slate-700/50 relative overflow-hidden`}
    >
      {/* Rarity Badge */}
      <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
        {skin.rarity}
      </div>

      {/* Skin Image */}
      <div className="bg-black/30 rounded-lg h-32 mb-4 flex items-center justify-center">
        {skin.image_url ? (
          <img 
            src={skin.image_url} 
            alt={skin.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <Package className="w-12 h-12 text-white/50" />
        )}
      </div>

      {/* Skin Info */}
      <div className="space-y-2">
        <h3 className="text-white font-bold text-sm">{skin.name}</h3>
        <p className="text-white/80 text-xs">{skin.weapon_type}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-yellow-400">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-bold">{skin.price}</span>
          </div>
          
          <button
            onClick={handleClick}
            disabled={isDisabled}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              !isDisabled
                ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="w-3 h-3" />
            <span>
              {isPurchasing ? "Покупка..." : !canAfford ? "Нет средств" : "Купить"}
            </span>
          </button>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-6 -translate-y-6"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full transform -translate-x-4 translate-y-4"></div>
      </div>
    </div>
  );
};

export default ShopSkinCard;
