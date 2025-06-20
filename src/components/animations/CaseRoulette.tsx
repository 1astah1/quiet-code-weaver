
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
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
    // Создаем массив предметов для рулетки
    const items = [];
    for (let i = 0; i < 15; i++) {
      if (i === 7) {
        // Выигрышный предмет в центре
        items.push(wonSkin);
      } else {
        // Случайные предметы из кейса
        const randomSkin = caseSkins[Math.floor(Math.random() * caseSkins.length)]?.skins;
        if (randomSkin) {
          items.push(randomSkin);
        }
      }
    }
    setRouletteItems(items);

    // Запускаем анимацию
    setTimeout(() => {
      setIsSpinning(true);
    }, 500);

    // Останавливаем через 4 секунды
    setTimeout(() => {
      setIsSpinning(false);
      setTimeout(onComplete, 1000);
    }, 4000);
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

  return (
    <div className="space-y-6 sm:space-y-8">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 text-center">Крутим рулетку...</h2>
      
      {/* Рулетка */}
      <div className="relative overflow-hidden mx-4 sm:mx-8">
        {/* Указатель */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[20px] border-l-transparent border-r-transparent border-b-orange-500 drop-shadow-lg"></div>
        </div>
        
        {/* Контейнер рулетки */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-600/50 overflow-hidden relative">
          <div 
            className={`flex transition-transform duration-4000 ease-out ${
              isSpinning ? 'transform -translate-x-[50%]' : ''
            }`}
            style={{
              transform: isSpinning ? 'translateX(calc(-50% + 200px))' : 'translateX(0)',
            }}
          >
            {rouletteItems.map((item, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-24 sm:w-32 md:w-40 h-24 sm:h-32 md:h-40 border-2 ${getRarityColor(item?.rarity)} p-2 sm:p-3 flex flex-col items-center justify-center transition-all duration-300`}
              >
                <div className="w-full h-2/3 flex items-center justify-center mb-1 sm:mb-2">
                  {item?.image_url ? (
                    <LazyImage
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      fallback={<div className="text-lg sm:text-xl">🔫</div>}
                    />
                  ) : (
                    <div className="text-lg sm:text-xl">🔫</div>
                  )}
                </div>
                <div className="text-white text-[8px] sm:text-[10px] md:text-xs font-medium text-center leading-tight truncate w-full">
                  {item?.name?.substring(0, 15) || 'Скин'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Анимированные частицы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`
            }}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400/40" />
          </div>
        ))}
      </div>

      <p className="text-yellow-300 text-lg sm:text-xl md:text-2xl font-semibold animate-pulse text-center">
        Определяем победителя!
      </p>
    </div>
  );
};

export default CaseRoulette;
