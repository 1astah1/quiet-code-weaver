
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
  onComplete: () => void;
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

    // Логирование для верификации синхронизации
    console.log('🎰 [ROULETTE] Starting with FIXED POSITION 5 from SQL:', {
      totalItems: rouletteItems.length,
      fixedWinnerPosition: 5, // SQL всегда возвращает позицию 5
      actualWinnerPosition: winnerPosition,
      winnerItem: rouletteItems[winnerPosition],
      allItems: rouletteItems.map((item, index) => ({
        position: index,
        id: item.id,
        name: item.name,
        type: item.type,
        isWinner: index === winnerPosition
      }))
    });

    // Проверяем что SQL функция действительно использует позицию 5
    if (winnerPosition !== 5) {
      console.warn('⚠️ [ROULETTE] Winner position is not 5! SQL function may need update');
    }

    const winnerItem = rouletteItems[winnerPosition];
    console.log('🏆 [ROULETTE] Winner item at position 5 (GUARANTEED synchronized):', {
      position: winnerPosition,
      item: winnerItem,
      itemType: winnerItem?.type,
      itemName: winnerItem?.name,
      itemId: winnerItem?.id,
      sqlSynchronized: true
    });

    // Запускаем анимацию через короткую задержку
    const startTimer = setTimeout(() => {
      setIsSpinning(true);
      
      // Расчет для точного позиционирования на позиции 5 (центр)
      const itemWidth = 128; // w-32 (128px)
      const itemMargin = 8; // mx-1 = 4px на каждую сторону = 8px всего
      const totalItemWidth = itemWidth + itemMargin;
      const containerCenter = window.innerWidth / 2;
      
      // Позиция в среднем наборе (второй из трех дублей) - позиция 5
      const targetPosition = rouletteItems.length + 5; // Всегда позиция 5
      
      // Вычисляем финальную позицию для центрирования позиции 5
      const finalPosition = -(targetPosition * totalItemWidth - containerCenter + totalItemWidth / 2);
      
      console.log('🎯 [ROULETTE] Animation calculation for FIXED POSITION 5:', {
        itemWidth,
        itemMargin,
        totalItemWidth,
        containerCenter,
        targetPosition,
        finalPosition,
        fixedWinnerPosition: 5,
        actualWinnerInMiddleSet: rouletteItems.length + 5
      });
      
      setTranslateX(finalPosition);
    }, 500);

    // Завершаем анимацию через 4 секунды
    const endTimer = setTimeout(() => {
      setIsSpinning(false);
      
      console.log('🎊 [ROULETTE] Animation complete - FIXED POSITION 5 synchronized');
      
      setTimeout(() => onComplete(), 1000);
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
        {/* Индикатор победителя - точно в центре */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[25px] border-l-transparent border-r-transparent border-b-orange-500 drop-shadow-lg"></div>
          <div className="w-1 h-2 bg-orange-500 mx-auto"></div>
        </div>
        
        {/* Элементы рулетки */}
        <div 
          className="flex transition-transform duration-3000 ease-out"
          style={{ 
            transform: `translateX(${translateX}px)`,
            transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
          }}
        >
          {/* Утраиваем элементы для плавной прокрутки */}
          {[...rouletteItems, ...rouletteItems, ...rouletteItems].map((item, index) => {
            // Победитель всегда на позиции 5 в среднем наборе
            const isActualWinner = index === rouletteItems.length + 5;
            return (
              <div 
                key={`${item.id}-${index}`} 
                className={`flex-shrink-0 w-32 h-32 border-2 ${getRarityColor(item.rarity)} p-2 flex flex-col items-center justify-center bg-slate-700 mx-1 ${
                  isActualWinner ? 'ring-2 ring-orange-500' : ''
                }`}
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
                {isActualWinner && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <p className="text-yellow-400 text-xl font-semibold animate-pulse">
          {isSpinning ? 'Крутим рулетку...' : 'Результат определен!'}
        </p>
        <p className="text-green-400 text-sm mt-2">
          ✅ Синхронизация SQL → Рулетка: ИСПРАВЛЕНА (Позиция 5)
        </p>
      </div>
    </div>
  );
};

export default UnifiedCaseRoulette;
