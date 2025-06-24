import { useState } from "react";
import { Coins, Package, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import LazyImage from "@/components/ui/LazyImage";

interface CaseCompletePhaseProps {
  wonSkin: any;
  isProcessing: boolean;
  onAddToInventory: () => void;
  onSellDirectly: () => void;
}

const CaseCompletePhase = ({ 
  wonSkin, 
  isProcessing, 
  onAddToInventory, 
  onSellDirectly 
}: CaseCompletePhaseProps) => {
  const [isAnimating, setIsAnimating] = useState(true);

  // Логирование для отладки
  console.log('🎊 [CASE_COMPLETE] Rendering with reward:', {
    wonSkin,
    skinType: wonSkin?.type,
    skinName: wonSkin?.name,
    skinPrice: wonSkin?.price,
    skinRarity: wonSkin?.rarity,
    skinWeaponType: wonSkin?.weapon_type,
    skinImageUrl: wonSkin?.image_url
  });

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'consumer': return 'border-gray-500 bg-gray-500/20';
      case 'industrial': return 'border-blue-500 bg-blue-500/20';
      case 'mil-spec': return 'border-purple-500 bg-purple-500/20';
      case 'restricted': return 'border-pink-500 bg-pink-500/20';
      case 'classified': return 'border-red-500 bg-red-500/20';
      case 'covert': return 'border-yellow-500 bg-yellow-500/20';
      case 'legendary': return 'border-orange-500 bg-orange-500/20';
      case 'mythical': return 'border-purple-600 bg-purple-600/20';
      default: return 'border-gray-500 bg-gray-500/20';
    }
  };

  const getRarityGlow = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'consumer': return 'shadow-gray-500/50';
      case 'industrial': return 'shadow-blue-500/50';
      case 'mil-spec': return 'shadow-purple-500/50';
      case 'restricted': return 'shadow-pink-500/50';
      case 'classified': return 'shadow-red-500/50';
      case 'covert': return 'shadow-yellow-500/50';
      case 'legendary': return 'shadow-orange-500/50';
      case 'mythical': return 'shadow-purple-600/50';
      default: return 'shadow-gray-500/50';
    }
  };

  return (
    <div className="min-h-[600px] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Фоновые эффекты */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,255,0,0.1)_0%,_transparent_70%)] animate-pulse"></div>
      
      {/* Конфетти эффект */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random()}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        {/* Заголовок */}
        <div className="space-y-4">
          <h2 className="text-5xl font-bold text-white mb-4 animate-bounce">
            🎉 Поздравляем! 🎉
          </h2>
          <p className="text-yellow-400 text-2xl font-semibold animate-pulse">
            Вы выиграли:
          </p>
        </div>
        
        {/* Карточка награды */}
        <div className={`relative p-8 rounded-2xl border-4 ${getRarityColor(wonSkin?.rarity)} ${getRarityGlow(wonSkin?.rarity)} shadow-2xl transform transition-all duration-500 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
          {/* Фон карточки */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-xl"></div>
          
          {/* Изображение скина */}
          <div className="relative mb-6">
            <div className="w-48 h-48 mx-auto bg-black/30 rounded-xl flex items-center justify-center relative overflow-hidden">
              {wonSkin?.image_url ? (
                <LazyImage
                  src={wonSkin.image_url}
                  alt={wonSkin.name}
                  className="w-full h-full object-contain animate-fade-in"
                  fallback={<span className="text-6xl animate-bounce">🔫</span>}
                  onError={() => console.log('Image failed to load:', wonSkin.image_url)}
                />
              ) : (
                <span className="text-6xl animate-bounce">🔫</span>
              )}
              
              {/* Эффект свечения */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-pulse"></div>
            </div>
          </div>
          
          {/* Информация о скине */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-2xl leading-tight">
              {wonSkin?.name || 'Неизвестный скин'}
            </h3>
            <p className="text-white/90 text-lg">
              {wonSkin?.weapon_type || 'Оружие'}
            </p>
            <p className={`text-sm font-bold uppercase tracking-wider ${getRarityColor(wonSkin?.rarity).includes('yellow') ? 'text-yellow-400' : 'text-white/70'}`}>
              {wonSkin?.rarity || 'Common'}
            </p>
            
            {/* Цена */}
            <div className="flex items-center justify-center space-x-2 pt-4">
              <Coins className="w-6 h-6 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-2xl">
                {wonSkin?.price || 0} монет
              </span>
            </div>
          </div>
        </div>
        
        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onAddToInventory}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 text-lg rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
            size="lg"
          >
            <Package className="w-5 h-5 mr-2" />
            Забрать в инвентарь
          </Button>
          
          <Button
            onClick={onSellDirectly}
            disabled={isProcessing}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 text-lg rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
            size="lg"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Продать за {wonSkin?.price || 0} монет
          </Button>
        </div>
        
        {/* Индикатор загрузки */}
        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Обработка...</span>
          </div>
        )}
      </div>
      
      {/* Анимированные линии */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </div>
  );
};

export default CaseCompletePhase;
