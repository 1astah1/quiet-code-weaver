import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Coins } from "lucide-react";
import InstantImage from "@/components/ui/InstantImage";

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
  isAdmin?: boolean; // ДОБАВЛЕНО: Проп для статуса администратора
}

const ShopSkinCard = ({ 
  skin, 
  canAfford, 
  onPurchase, 
  isPurchasing,
  isAdmin = false 
}: ShopSkinCardProps) => {
  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'Consumer Grade': 'bg-gray-100 text-gray-800',
      'Industrial Grade': 'bg-blue-100 text-blue-800',
      'Mil-Spec': 'bg-purple-100 text-purple-800',
      'Restricted': 'bg-pink-100 text-pink-800',
      'Classified': 'bg-red-100 text-red-800',
      'Covert': 'bg-orange-100 text-orange-800',
      'Contraband': 'bg-yellow-100 text-yellow-800'
    };
    return colors[rarity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 ${
      !canAfford ? 'opacity-60' : 'hover:scale-105'
    } ${isAdmin ? 'ring-2 ring-yellow-300 bg-gradient-to-br from-yellow-50 to-white' : ''}`}>
      <CardContent className="p-2 sm:p-3">
        <div className="aspect-square mb-2 relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
          {/* ДОБАВЛЕНО: Индикатор администратора */}
          {isAdmin && (
            <div className="absolute top-1 left-1 z-10">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Админ
              </Badge>
            </div>
          )}
          
          <InstantImage
            src={skin.image_url}
            alt={skin.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-200"
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                <span className="text-slate-500 text-xs">No Image</span>
              </div>
            }
          />
        </div>

        <div className="space-y-1 sm:space-y-2">
          <h3 className="font-medium text-xs sm:text-sm line-clamp-2 min-h-[2.5rem] sm:min-h-[2.8rem] text-slate-800">
            {skin.name}
          </h3>
          
          <div className="space-y-1">
            <Badge 
              variant="outline" 
              className={`text-xs px-1 py-0 ${getRarityColor(skin.rarity)}`}
            >
              {skin.rarity}
            </Badge>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Coins className="h-3 w-3 text-yellow-600" />
                <span className={`text-xs sm:text-sm font-bold ${
                  isAdmin ? 'text-yellow-600 line-through' : 'text-slate-700'
                }`}>
                  {skin.price}
                </span>
                {/* ДОБАВЛЕНО: Показываем "БЕСПЛАТНО" для администраторов */}
                {isAdmin && (
                  <span className="text-xs font-bold text-green-600 ml-1">
                    БЕСПЛАТНО
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => onPurchase(skin)}
            disabled={isPurchasing || (!canAfford && !isAdmin)}
            className={`w-full text-xs h-7 sm:h-8 ${
              isAdmin 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white' 
                : ''
            }`}
          >
            {isPurchasing ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Покупка...</span>
              </div>
            ) : isAdmin ? (
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                <span>Получить</span>
              </div>
            ) : (
              'Купить'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopSkinCard;
