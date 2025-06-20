
import { Coins, ShoppingBag } from "lucide-react";
import { getRarityColor } from "@/utils/rarityColors";

interface CaseCompletePhaseProps {
  wonSkin: any;
  isProcessing: boolean;
  onAddToInventory: () => void;
  onSellDirectly: () => void;
}

const CaseCompletePhase = ({ wonSkin, isProcessing, onAddToInventory, onSellDirectly }: CaseCompletePhaseProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-5xl font-bold text-white mb-4">🎉 Поздравляем! 🎉</h2>
        <p className="text-yellow-400 text-2xl font-semibold">Вы выиграли:</p>
      </div>
      
      <div className={`bg-gradient-to-br ${getRarityColor(wonSkin.rarity)} rounded-3xl p-8 transform animate-scale-in border-4 border-white/30 relative overflow-hidden`}>
        <div className="bg-black/30 rounded-2xl h-48 mb-6 flex items-center justify-center relative overflow-hidden">
          {wonSkin.image_url ? (
            <img 
              src={wonSkin.image_url} 
              alt={wonSkin.name}
              className="max-w-full max-h-full object-contain animate-fade-in"
              onError={(e) => {
                console.log('Image failed to load:', wonSkin.image_url);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-8xl animate-bounce">🎯</span>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-pulse"></div>
        </div>
        
        <h3 className="text-white font-bold text-3xl mb-3">{wonSkin.name || 'Неизвестный скин'}</h3>
        <p className="text-white/90 text-xl mb-2">{wonSkin.weapon_type || 'Оружие'}</p>
        <p className="text-white/70 text-lg uppercase tracking-wider mb-4">{wonSkin.rarity || 'Common'}</p>
        
        <div className="flex items-center justify-center space-x-2 mb-6">
          <Coins className="w-6 h-6 text-yellow-400" />
          <span className="text-yellow-400 font-bold text-2xl">{wonSkin.price || 0} монет</span>
        </div>
      </div>
      
      <div className="flex space-x-4 justify-center">
        <button
          onClick={onAddToInventory}
          disabled={isProcessing}
          className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 disabled:transform-none"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>{isProcessing ? "Добавляем..." : "Забрать в инвентарь"}</span>
        </button>
        
        <button
          onClick={onSellDirectly}
          disabled={isProcessing}
          className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 disabled:transform-none"
        >
          <Coins className="w-5 h-5" />
          <span>{isProcessing ? "Продаем..." : `Продать за ${wonSkin.price || 0}`}</span>
        </button>
      </div>
      
      <p className="text-gray-400 text-sm">Выберите действие с выигранным предметом</p>
    </div>
  );
};

export default CaseCompletePhase;
