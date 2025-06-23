
import { Button } from "@/components/ui/button";
import { Coins, Package } from "lucide-react";
import LazyImage from "@/components/ui/LazyImage";

interface InventoryItemProps {
  item: {
    id: string;
    obtained_at: string;
    is_sold: boolean;
    sold_at?: string;
    sold_price?: number;
    skins?: {
      id: string;
      name: string;
      weapon_type: string;
      rarity: string;
      price: number;
      image_url?: string;
    };
  };
  onSell: (inventoryId: string, price: number) => void;
  isLoading: boolean;
}

const InventoryItem = ({ item, onSell, isLoading }: InventoryItemProps) => {
  const skin = item.skins;
  
  if (!skin) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'consumer': return 'border-gray-400';
      case 'industrial': return 'border-blue-400';
      case 'mil-spec': return 'border-purple-400';
      case 'restricted': return 'border-pink-400';
      case 'classified': return 'border-red-400';
      case 'covert': return 'border-yellow-400';
      case 'contraband': return 'border-orange-500';
      default: return 'border-gray-400';
    }
  };

  return (
    <div className={`bg-slate-800/50 rounded-lg p-3 border-2 ${getRarityColor(skin.rarity)} ${
      item.is_sold ? 'opacity-50' : ''
    }`}>
      {/* Изображение скина */}
      <div className="aspect-square mb-3 bg-slate-700/50 rounded-lg overflow-hidden">
        {skin.image_url ? (
          <LazyImage
            src={skin.image_url}
            alt={skin.name}
            className="w-full h-full object-contain"
            timeout={3000}
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
        )}
        
        {item.is_sold && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-red-400 font-bold text-sm">ПРОДАНО</span>
          </div>
        )}
      </div>

      {/* Информация о скине */}
      <div className="space-y-2">
        <h3 className="text-white font-medium text-sm truncate" title={skin.name}>
          {skin.name}
        </h3>
        
        <p className="text-slate-400 text-xs">{skin.weapon_type}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Coins className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">
              {item.is_sold ? item.sold_price : skin.price}
            </span>
          </div>
          
          <span className={`text-xs px-2 py-1 rounded ${getRarityColor(skin.rarity)} bg-opacity-20`}>
            {skin.rarity}
          </span>
        </div>

        {/* Кнопка продажи */}
        {!item.is_sold && (
          <Button
            onClick={() => onSell(item.id, skin.price)}
            disabled={isLoading}
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
          >
            {isLoading ? 'Продажа...' : 'Продать'}
          </Button>
        )}
        
        {item.is_sold && (
          <div className="text-center">
            <p className="text-slate-400 text-xs">
              Продано {new Date(item.sold_at!).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryItem;
