
import { useState, useEffect } from "react";
import LazyImage from "@/components/ui/LazyImage";

interface RouletteItem {
  id: string;
  name: string;
  weapon_type?: string;
  rarity?: string;
  price: number;
  image_url?: string | null;
  type: 'skin' | 'coin_reward';
  amount?: number;
}

interface UnifiedCaseRouletteProps {
  rouletteItems: RouletteItem[];
  winnerPosition: number;
  onComplete: (winnerItem: RouletteItem) => void;
}

const UnifiedCaseRoulette = ({ 
  rouletteItems, 
  winnerPosition, 
  onComplete 
}: UnifiedCaseRouletteProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [translateX, setTranslateX] = useState(0);

  useEffect(() => {
    if (!rouletteItems || rouletteItems.length === 0) {
      console.error('❌ [ROULETTE] No roulette items provided');
      return;
    }

    console.log('🎰 [ROULETTE] Starting with items:', rouletteItems.length);
    console.log('🎯 [ROULETTE] Winner position:', winnerPosition);
    console.log('🏆 [ROULETTE] Winner item:', rouletteItems[winnerPosition]);

    // Проверяем корректность данных
    if (winnerPosition < 0 || winnerPosition >= rouletteItems.length) {
      console.error('❌ [ROULETTE] Invalid winner position:', winnerPosition);
      return;
    }

    // Небольшая задержка перед началом анимации
    const startTimer = setTimeout(() => {
      setIsSpinning(true);
      
      // Исправленный расчет позиционирования
      const itemWidth = 128; // ширина одного элемента (w-32)
      const itemMargin = 4; // margin (mx-1 = 4px с каждой стороны)
      const totalItemWidth = itemWidth + itemMargin * 2; // полная ширина с отступами
      const containerCenter = window.innerWidth / 2;
      
      // Используем средний набор (второй из трех дубликатов)
      // Позиция в среднем наборе = originalLength + winnerPosition
      const targetPosition = rouletteItems.length + winnerPosition;
      
      // Вычисляем финальную позицию для точного центрирования
      const finalPosition = -(targetPosition * totalItemWidth - containerCenter + totalItemWidth / 2);
      
      console.log('🎯 [ROULETTE] Calculated position:', {
        itemWidth,
        itemMargin,
        totalItemWidth,
        targetPosition,
        finalPosition
      });
      
      setTranslateX(finalPosition);
    }, 500);

    // Завершаем анимацию через 4 секунды
    const endTimer = setTimeout(() => {
      setIsSpinning(false);
      const winnerItem = rouletteItems[winnerPosition];
      console.log('🏆 [ROULETTE] Animation complete, winner:', winnerItem?.name);
      
      if (winnerItem) {
        console.log('✅ [ROULETTE] Calling onComplete with winner item');
        setTimeout(() => onComplete(winnerItem), 1000);
      } else {
        console.error('❌ [ROULETTE] Winner item not found at position:', winnerPosition);
      }
    }, 4000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [rouletteItems, winnerPosition, onComplete]);

  if (!rouletteItems || rouletteItems.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-white text-xl">Подготовка рулетки...</div>
      </div>
    );
  }

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'consumer': return 'border-gray-500';
      case 'industrial': return 'border-blue-500';
      case 'mil-spec': return 'border-purple-500';
      case 'restricted': return 'border-pink-500';
      case 'classified': return 'border-red-500';
      case 'covert': return 'border-yellow-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <div className="space-y-8 p-4 bg-slate-900">
      <h2 className="text-3xl font-bold text-white text-center">Крутим рулетку!</h2>
      
      <div className="relative overflow-hidden bg-slate-800 rounded-lg border-2 border-orange-500/50 h-40">
        {/* Улучшенный указатель победителя */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[25px] border-l-transparent border-r-transparent border-b-orange-500 drop-shadow-lg"></div>
          <div className="w-1 h-2 bg-orange-500 mx-auto"></div>
        </div>
        
        {/* Рулетка */}
        <div 
          className="flex transition-transform duration-3000 ease-out"
          style={{ 
            transform: `translateX(${translateX}px)`,
            transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
          }}
        >
          {/* Дублируем элементы для бесшовной прокрутки */}
          {[...rouletteItems, ...rouletteItems, ...rouletteItems].map((item, index) => (
            <div 
              key={`${item.id}-${index}`} 
              className={`flex-shrink-0 w-32 h-32 border-2 ${getRarityColor(item.rarity)} p-2 flex flex-col items-center justify-center bg-slate-700 mx-1`}
            >
              <div className="w-full h-20 flex items-center justify-center mb-1">
                {item.image_url ? (
                  <LazyImage
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    fallback={
                      <div className="text-2xl">
                        {item.type === 'coin_reward' ? '🪙' : '🔫'}
                      </div>
                    }
                  />
                ) : (
                  <div className="text-2xl">
                    {item.type === 'coin_reward' ? '🪙' : '🔫'}
                  </div>
                )}
              </div>
              <div className="text-white text-xs text-center truncate w-full">
                {item.type === 'coin_reward' ? `${item.amount} монет` : item.name?.substring(0, 12)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <p className="text-yellow-400 text-xl font-semibold animate-pulse">
          {isSpinning ? 'Крутим рулетку...' : 'Результат определен!'}
        </p>
      </div>
    </div>
  );
};

export default UnifiedCaseRoulette;
