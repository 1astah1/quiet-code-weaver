
import { Coins, ShoppingBag } from "lucide-react";
import { getRarityColor } from "@/utils/rarityColors";
import LazyImage from "@/components/ui/LazyImage";

interface CaseCompletePhaseProps {
  wonSkin: any;
  isProcessing: boolean;
  onAddToInventory: () => void;
  onSellDirectly: () => void;
}

const CaseCompletePhase = ({ wonSkin, isProcessing, onAddToInventory, onSellDirectly }: CaseCompletePhaseProps) => {
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in px-4 sm:px-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4">🎉 Поздравляем! 🎉</h2>
        <p className="text-yellow-400 text-lg sm:text-xl md:text-2xl font-semibold">Вы выиграли:</p>
      </div>
      
      <div className={`bg-gradient-to-br ${getRarityColor(wonSkin.rarity)} rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 transform animate-scale-in border-2 sm:border-4 border-white/30 relative overflow-hidden max-w-md mx-auto`}>
        <div className="bg-black/30 rounded-xl sm:rounded-2xl h-32 sm:h-40 md:h-48 mb-4 sm:mb-6 flex items-center justify-center relative overflow-hidden">
          {wonSkin.image_url ? (
            <LazyImage
              src={wonSkin.image_url}
              alt={wonSkin.name}
              className="max-w-full max-h-full object-contain animate-fade-in"
              fallback={<span className="text-4xl sm:text-6xl md:text-8xl animate-bounce">🎯</span>}
              onError={() => console.log('Image failed to load:', wonSkin.image_url)}
            />
          ) : (
            <span className="text-4xl sm:text-6xl md:text-8xl animate-bounce">🎯</span>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-pulse"></div>
        </div>
        
        <div className="text-center space-y-1 sm:space-y-2">
          <h3 className="text-white font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl leading-tight">{wonSkin.name || 'Неизвестный скин'}</h3>
          <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl">{wonSkin.weapon_type || 'Оружие'}</p>
          <p className="text-white/70 text-xs sm:text-sm md:text-base lg:text-lg uppercase tracking-wider">{wonSkin.rarity || 'Common'}</p>
          
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 pt-2 sm:pt-4">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-lg sm:text-xl md:text-2xl">{wonSkin.price || 0} монет</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
        <button
          onClick={onAddToInventory}
          disabled={isProcessing}
          className="flex items-center justify-center space-x-2 sm:space-x-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 sm:py-4 px-4 sm:px-6 md:px-8 rounded-xl font-bold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 disabled:transform-none flex-1 sm:flex-none"
        >
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="whitespace-nowrap">{isProcessing ? "Добавляем..." : "Забрать в инвентарь"}</span>
        </button>
        
        <button
          onClick={onSellDirectly}
          disabled={isProcessing}
          className="flex items-center justify-center space-x-2 sm:space-x-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 sm:py-4 px-4 sm:px-6 md:px-8 rounded-xl font-bold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 disabled:transform-none flex-1 sm:flex-none"
        >
          <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="whitespace-nowrap">{isProcessing ? "Продаем..." : `Продать за ${wonSkin.price || 0}`}</span>
        </button>
      </div>
      
      <p className="text-gray-400 text-xs sm:text-sm text-center px-4">Выберите действие с выигранным предметом</p>
    </div>
  );
};

export default CaseCompletePhase;
