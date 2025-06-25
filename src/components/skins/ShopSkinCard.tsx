import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Star } from "lucide-react";
import LazyImage from "@/components/ui/LazyImage";
import { Button } from "@/components/ui/button";

interface Skin {
  id: string;
  name: string;
  rarity: string;
  price: number;
  image_url: string | null;
  weapon_type?: string;
}

interface ShopSkinCardProps {
  skin: Skin;
  onBuy: (skin: Skin) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const getRarityColor = (rarity: string) => {
  const rarityColors: { [key: string]: string } = {
    'Covert': 'border-red-500 text-red-500',
    'Classified': 'border-pink-500 text-pink-500',
    'Restricted': 'border-purple-500 text-purple-500',
    'Mil-Spec': 'border-blue-500 text-blue-500',
    'Industrial Grade': 'border-blue-300 text-blue-300',
    'Consumer Grade': 'border-gray-400 text-gray-400',
  };
  return rarityColors[rarity] || 'border-gray-400 text-gray-400';
};

const ShopSkinCard = ({ skin, onBuy, isFavorite, onToggleFavorite }: ShopSkinCardProps) => {
  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-slate-700/50 group transition-all hover:scale-105 hover:border-orange-500/50">
      <div className="relative">
        <div className="aspect-square bg-gray-700/30 p-2 sm:p-4">
          <LazyImage
            src={skin.image_url ?? ''}
            alt={skin.name}
            className="w-full h-full object-contain"
            timeout={2000}
            fallback={<div className="w-full h-full bg-gray-600/50 rounded-md" />}
          />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`absolute top-1.5 right-1.5 p-1 rounded-full transition-colors ${
            isFavorite ? 'bg-yellow-400/20 text-yellow-400' : 'bg-black/20 text-gray-400 hover:text-white'
          }`}
        >
          <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-2">
        <p className={`text-xs font-semibold truncate ${getRarityColor(skin.rarity)}`}>{skin.rarity}</p>
        <h3 className="text-white text-sm font-medium truncate mt-1">{skin.name}</h3>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-yellow-400">
            <Coins className="w-4 h-4" />
            <span className="font-bold text-sm">{skin.price}</span>
          </div>
          <Button
            onClick={() => onBuy(skin)}
            size="sm"
            className="text-xs h-auto py-1 px-3 bg-orange-500 hover:bg-orange-600"
          >
            Купить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShopSkinCard;
