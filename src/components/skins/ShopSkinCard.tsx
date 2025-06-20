
import { Heart, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LazyImage from "@/components/ui/LazyImage";

interface ShopSkinCardProps {
  skin: {
    id: string;
    name: string;
    weapon_type: string;
    rarity: string;
    price: number;
    image_url: string | null;
  };
  canAfford: boolean;
  onPurchase: (skin: any) => void;
  isPurchasing: boolean;
}

const rarityColors = {
  'Consumer Grade': 'border-gray-400 bg-gray-400/10',
  'Industrial Grade': 'border-blue-400 bg-blue-400/10',
  'Mil-Spec': 'border-purple-400 bg-purple-400/10',
  'Restricted': 'border-pink-400 bg-pink-400/10',
  'Classified': 'border-red-400 bg-red-400/10',
  'Covert': 'border-orange-400 bg-orange-400/10',
  'Contraband': 'border-yellow-400 bg-yellow-400/10'
};

const getRarityColor = (rarity: string) => {
  return rarityColors[rarity as keyof typeof rarityColors] || 'border-gray-400 bg-gray-400/10';
};

const ShopSkinCard = ({ skin, canAfford, onPurchase, isPurchasing }: ShopSkinCardProps) => {
  return (
    <div className={`bg-slate-800/50 rounded-lg border ${getRarityColor(skin.rarity)} p-4 hover:scale-105 transition-all duration-200`}>
      {/* Image with Lazy Loading */}
      <div className="aspect-square bg-slate-700/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {skin.image_url ? (
          <LazyImage
            src={skin.image_url}
            alt={skin.name}
            className="w-full h-full object-contain"
            fallback={
              <div className="w-full h-full flex items-center justify-center text-4xl">
                🔫
              </div>
            }
            onError={() => console.log('Failed to load image for:', skin.name)}
          />
        ) : (
          <div className="text-4xl">🔫</div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold text-sm truncate" title={skin.name}>
          {skin.name}
        </h3>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{skin.weapon_type}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getRarityColor(skin.rarity).split(' ')[1]}`}>
            {skin.rarity}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">₽</span>
            </div>
            <span className="text-orange-400 font-bold text-sm">{skin.price}</span>
          </div>
          
          <Button
            onClick={() => onPurchase(skin)}
            disabled={!canAfford || isPurchasing}
            size="sm"
            className={`text-xs px-3 py-1 ${
              canAfford 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isPurchasing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-3 h-3 mr-1" />
                Купить
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShopSkinCard;
