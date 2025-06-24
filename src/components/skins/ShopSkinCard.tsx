import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Coins, AlertCircle } from "lucide-react";
import InstantImage from "@/components/ui/InstantImage";
import SecureButton from "@/components/ui/SecureButton";

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
  onPurchase: (skin: Skin) => Promise<void>;
  isPurchasing: boolean;
  isAdmin?: boolean;
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

  const handleSecurePurchase = async () => {
    await onPurchase(skin);
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 ${
      !canAfford ? 'opacity-60' : 'hover:scale-105'
    } ${isAdmin ? 'ring-2 ring-yellow-300 bg-gradient-to-br from-yellow-50 to-white' : ''}`}>
      <CardContent className="p-1.5 mobile-small:p-2 mobile-medium:p-2 mobile-large:p-2.5 sm:p-3">
        <div className="aspect-square mb-1.5 mobile-small:mb-2 mobile-medium:mb-2 mobile-large:mb-2 sm:mb-2 relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
          {isAdmin && (
            <div className="absolute top-0.5 mobile-small:top-1 mobile-medium:top-1 mobile-large:top-1 sm:top-1 left-0.5 mobile-small:left-1 mobile-medium:left-1 mobile-large:left-1 sm:left-1 z-10">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-xs">
                <Crown className="h-2.5 w-2.5 mobile-small:h-3 mobile-small:w-3 mobile-medium:h-3 mobile-medium:w-3 mobile-large:h-3 mobile-large:w-3 sm:h-3 sm:w-3 mr-0.5 mobile-small:mr-1 mobile-medium:mr-1 mobile-large:mr-1 sm:mr-1" />
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
                <span className="text-slate-500 text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-xs">No Image</span>
              </div>
            }
          />
        </div>

        <div className="space-y-1 mobile-small:space-y-1 mobile-medium:space-y-1.5 mobile-large:space-y-1.5 sm:space-y-2">
          <h3 className="font-medium text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-sm line-clamp-2 min-h-[2rem] mobile-small:min-h-[2.2rem] mobile-medium:min-h-[2.4rem] mobile-large:min-h-[2.6rem] sm:min-h-[2.8rem] text-slate-800">
            {skin.name}
          </h3>
          
          <div className="space-y-0.5 mobile-small:space-y-1 mobile-medium:space-y-1 mobile-large:space-y-1 sm:space-y-1">
            <Badge 
              variant="outline" 
              className={`text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-xs px-1 py-0 ${getRarityColor(skin.rarity)}`}
            >
              {skin.rarity}
            </Badge>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 mobile-small:gap-1 mobile-medium:gap-1 mobile-large:gap-1 sm:gap-1">
                <Coins className="h-2.5 w-2.5 mobile-small:h-3 mobile-small:w-3 mobile-medium:h-3 mobile-medium:w-3 mobile-large:h-3 mobile-large:w-3 sm:h-3 sm:w-3 text-yellow-600" />
                <span className={`text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-sm font-bold ${
                  isAdmin ? 'text-yellow-600 line-through' : 'text-slate-700'
                }`}>
                  {skin.price}
                </span>
                {isAdmin && (
                  <span className="text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-xs font-bold text-green-600 ml-0.5 mobile-small:ml-1 mobile-medium:ml-1 mobile-large:ml-1 sm:ml-1">
                    БЕСПЛАТНО
                  </span>
                )}
              </div>
            </div>
          </div>

          <SecureButton
            size="sm"
            onSecureClick={handleSecurePurchase}
            disabled={!canAfford && !isAdmin}
            debounceMs={500}
            cooldownMs={2000}
            maxAttempts={3}
            loadingText="Покупка..."
            blockedText="Подождите..."
            className={`w-full text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-xs h-6 mobile-small:h-7 mobile-medium:h-7 mobile-large:h-8 sm:h-8 ${
              isAdmin 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white' 
                : ''
            }`}
          >
            {isAdmin ? (
              <div className="flex items-center gap-0.5 mobile-small:gap-1 mobile-medium:gap-1 mobile-large:gap-1 sm:gap-1">
                <Crown className="h-2.5 w-2.5 mobile-small:h-3 mobile-small:w-3 mobile-medium:h-3 mobile-medium:w-3 mobile-large:h-3 mobile-large:w-3 sm:h-3 sm:w-3" />
                <span>Получить</span>
              </div>
            ) : (
              'Купить'
            )}
          </SecureButton>

          {!canAfford && !isAdmin && (
            <div className="flex items-center gap-0.5 mobile-small:gap-1 mobile-medium:gap-1 mobile-large:gap-1 sm:gap-1 text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-xs text-red-600 mt-0.5 mobile-small:mt-1 mobile-medium:mt-1 mobile-large:mt-1 sm:mt-1">
              <AlertCircle className="h-2.5 w-2.5 mobile-small:h-3 mobile-small:w-3 mobile-medium:h-3 mobile-medium:w-3 mobile-large:h-3 mobile-large:w-3 sm:h-3 sm:w-3" />
              <span>Недостаточно монет</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopSkinCard;
