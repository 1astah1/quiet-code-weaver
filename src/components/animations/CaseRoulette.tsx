
import { useState, useEffect } from "react";
import LazyImage from "@/components/ui/LazyImage";

interface CaseRouletteProps {
  caseSkins: any[];
  wonSkin: any;
  onComplete: () => void;
}

const CaseRoulette = ({ caseSkins, wonSkin, onComplete }: CaseRouletteProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<any[]>([]);

  useEffect(() => {
    console.log('CaseRoulette: Initializing', { caseSkins: caseSkins?.length, wonSkin: !!wonSkin });
    
    if (!caseSkins || caseSkins.length === 0 || !wonSkin) {
      console.error('CaseRoulette: Invalid props');
      setTimeout(onComplete, 1000);
      return;
    }

    // Создаем массив предметов для рулетки
    const items = [];
    for (let i = 0; i < 15; i++) {
      if (i === 7) {
        items.push(wonSkin);
      } else {
        const randomSkin = caseSkins[Math.floor(Math.random() * caseSkins.length)]?.skins;
        items.push(randomSkin || wonSkin);
      }
    }
    setRouletteItems(items);

    // Запускаем анимацию
    const startTimer = setTimeout(() => {
      console.log('CaseRoulette: Starting spin');
      setIsSpinning(true);
    }, 500);

    const stopTimer = setTimeout(() => {
      console.log('CaseRoulette: Stopping spin');
      setIsSpinning(false);
      setTimeout(() => {
        console.log('CaseRoulette: Completing');
        onComplete();
      }, 1000);
    }, 3500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(stopTimer);
    };
  }, [caseSkins, wonSkin, onComplete]);

  const getRarityColor = (rarity: string) => {
    const colors = {
      'Covert': 'border-orange-500 bg-orange-500/20',
      'Classified': 'border-red-500 bg-red-500/20',
      'Restricted': 'border-purple-500 bg-purple-500/20',
      'Mil-Spec': 'border-blue-500 bg-blue-500/20',
      'Industrial Grade': 'border-blue-400 bg-blue-400/20',
      'Consumer Grade': 'border-gray-500 bg-gray-500/20',
    };
    return colors[rarity as keyof typeof colors] || 'border-gray-500 bg-gray-500/20';
  };

  if (!rouletteItems.length) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-white text-center">Загрузка рулетки...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center">Определяем победителя...</h2>
      
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[20px] border-l-transparent border-r-transparent border-b-orange-500"></div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg border border-slate-600/50 overflow-hidden">
          <div 
            className={`flex transition-transform duration-3000 ease-out ${
              isSpinning ? 'transform -translate-x-[calc(50%-100px)]' : ''
            }`}
          >
            {rouletteItems.map((item, index) => (
              <div
                key={`roulette-${index}`}
                className={`flex-shrink-0 w-32 h-32 border-2 ${getRarityColor(item?.rarity)} p-2 flex flex-col items-center justify-center`}
              >
                <div className="w-full h-2/3 flex items-center justify-center mb-1">
                  {item?.image_url ? (
                    <LazyImage
                      src={item.image_url}
                      alt={item.name || 'Скин'}
                      className="w-full h-full object-contain"
                      fallback={<div className="text-lg">🔫</div>}
                    />
                  ) : (
                    <div className="text-lg">🔫</div>
                  )}
                </div>
                <div className="text-white text-[10px] font-medium text-center leading-tight truncate w-full">
                  {item?.name?.substring(0, 10) || 'Скин'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-yellow-300 text-xl font-semibold animate-pulse text-center">
        Рулетка крутится!
      </p>
    </div>
  );
};

export default CaseRoulette;
