import { Button } from '@/components/ui/button';
import type { CS2RouletteItem } from '@/hooks/useCS2CaseOpening';

interface CS2CaseResultProps {
  reward: CS2RouletteItem;
  onTake: () => void;
  onSell: () => void;
  isProcessing?: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  'consumer': 'border-gray-500',
  'industrial': 'border-blue-500',
  'mil-spec': 'border-purple-500',
  'restricted': 'border-pink-500',
  'classified': 'border-red-500',
  'covert': 'border-yellow-500',
  'legendary': 'border-orange-500',
  'mythical': 'border-purple-600',
};

export const CS2CaseResult = ({ reward, onTake, onSell, isProcessing }: CS2CaseResultProps) => {
  const rarity = reward.rarity?.toLowerCase() || 'consumer';
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl relative">
      {/* Вспышка и подсветка */}
      <div className={`absolute inset-0 rounded-2xl pointer-events-none ${['covert','legendary','mythical'].includes(rarity) ? 'animate-pulse bg-yellow-200/10' : ''}`}></div>
      <div className="relative z-10 flex flex-col items-center">
        <h2 className="text-4xl font-bold text-yellow-400 mb-4 animate-bounce">Поздравляем!</h2>
        <p className="text-white text-lg mb-6">Вам выпал скин:</p>
        <div className={`p-6 rounded-xl border-4 ${RARITY_COLORS[rarity] || 'border-gray-500'} bg-slate-800 shadow-xl flex flex-col items-center mb-8 relative animate-fade-in`}> 
          <div className="w-40 h-40 flex items-center justify-center mb-4">
            {reward.image_url ? (
              <img src={reward.image_url} alt={reward.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-6xl">🔫</span>
            )}
          </div>
          <div className="text-white text-2xl font-bold mb-2">{reward.name}</div>
          <div className="text-slate-400 text-lg mb-1">{reward.weapon_type}</div>
          <div className="text-xs uppercase text-yellow-400 font-bold mb-2">{reward.rarity}</div>
          <div className="text-yellow-400 text-xl font-bold mb-2">{reward.price} монет</div>
        </div>
        <div className="flex gap-4">
          <Button onClick={onTake} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 text-lg rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50">
            Забрать в инвентарь
          </Button>
          <Button onClick={onSell} disabled={isProcessing} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 text-lg rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50">
            Продать за {reward.price} монет
          </Button>
        </div>
        {isProcessing && (
          <div className="mt-4 flex items-center space-x-2 text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Обработка...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CS2CaseResult; 