
import { useState, useEffect } from "react";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface CaseRouletteProps {
  caseSkins: any[];
  onComplete: (selectedReward: any) => void;
  selectRandomReward: (rewards: any[]) => any;
}

const CaseRoulette = ({ caseSkins, onComplete, selectRandomReward }: CaseRouletteProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<any[]>([]);
  const [finalTransform, setFinalTransform] = useState(0);

  console.log('CaseRoulette: Rendering with', caseSkins.length, 'items');

  useEffect(() => {
    // Запускаем рулетку через небольшую задержку
    setTimeout(() => {
      startRoulette();
    }, 1000);
  }, [caseSkins]);

  const startRoulette = () => {
    console.log('🎰 Starting roulette');
    setIsSpinning(true);
    
    // Создаем расширенный список для рулетки (больше элементов для длинной прокрутки)
    const expandedItems = [];
    const itemsToShow = 100; // Увеличиваем количество элементов
    
    // Заполняем рулетку случайными элементами из доступных
    for (let i = 0; i < itemsToShow; i++) {
      const randomItem = caseSkins[Math.floor(Math.random() * caseSkins.length)];
      expandedItems.push({
        ...randomItem,
        id: `roulette-${i}`,
        displayData: randomItem.reward_type === 'coin_reward' ? randomItem.coin_rewards : randomItem.skins
      });
    }
    
    setRouletteItems(expandedItems);
    
    // Рассчитываем финальную позицию для остановки под стрелочкой
    const itemWidth = 96; // ширина одного элемента (w-24 = 96px)
    const containerWidth = 1024; // примерная ширина контейнера
    const centerPosition = containerWidth / 2; // центр контейнера (где стрелочка)
    
    // Случайная позиция остановки в диапазоне последних 20 элементов
    const minStopIndex = itemsToShow - 25;
    const maxStopIndex = itemsToShow - 5;
    const stopIndex = Math.floor(Math.random() * (maxStopIndex - minStopIndex) + minStopIndex);
    
    // Рассчитываем трансформацию чтобы нужный элемент оказался под стрелочкой
    const targetTransform = -(stopIndex * itemWidth - centerPosition + itemWidth / 2);
    setFinalTransform(targetTransform);
    
    // Анимация длится 6 секунд для более плавного эффекта
    setTimeout(() => {
      setIsSpinning(false);
      
      // После остановки определяем какой элемент под стрелочкой
      setTimeout(() => {
        // Находим элемент который под стрелочкой
        const winnerItem = expandedItems[stopIndex];
        console.log('🎯 Winner item at index:', stopIndex, winnerItem);
        
        // Передаем именно тот элемент который под стрелочкой
        onComplete(winnerItem);
      }, 1500); // Пауза для показа результата
    }, 6000); // Увеличена длительность анимации
  };

  const getRarityColor = (rarity: string) => {
    const rarityColors: { [key: string]: string } = {
      'consumer': '#b0c3d9',
      'industrial': '#5e98d9',
      'mil-spec': '#4b69ff',
      'restricted': '#8847ff',
      'classified': '#d32ce6',
      'covert': '#eb4b4b',
      'contraband': '#e4ae39'
    };
    return rarityColors[rarity?.toLowerCase()] || '#666666';
  };

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center bg-slate-900 relative overflow-hidden">
      <div className="text-white text-2xl font-bold mb-8">
        {isSpinning ? 'Крутим рулетку...' : 'Результат!'}
      </div>

      {/* Рулетка */}
      <div className="relative w-full max-w-4xl h-32 bg-slate-800 rounded-lg overflow-hidden border-2 border-orange-500/50">
        {/* Указатель */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-1 h-32 bg-orange-500 shadow-lg shadow-orange-500/50"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
            <div className="w-6 h-6 bg-orange-500 rotate-45 border-2 border-orange-600"></div>
          </div>
        </div>

        {/* Элементы рулетки */}
        <div 
          className={`flex h-full ${
            isSpinning ? 'transition-transform duration-6000 ease-out' : ''
          }`}
          style={{
            transform: isSpinning ? `translateX(${finalTransform}px)` : 'translateX(0)',
          }}
        >
          {rouletteItems.map((item, index) => {
            return (
              <div
                key={`${item.id}-${index}`}
                className="flex-shrink-0 w-24 h-32 border-r border-slate-700 flex flex-col items-center justify-center p-2 relative"
                style={{
                  backgroundColor: item.displayData?.rarity ? 
                    getRarityColor(item.displayData.rarity) + '20' : 
                    (item.reward_type === 'coin_reward' ? '#fbbf2420' : '#374151')
                }}
              >
                {/* Изображение */}
                <div className="w-16 h-16 mb-1">
                  {item.reward_type === 'coin_reward' ? (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">₽</span>
                    </div>
                  ) : item.displayData?.image_url ? (
                    <OptimizedImage
                      src={item.displayData.image_url}
                      alt={item.displayData.name || 'Item'}
                      className="w-full h-full object-contain"
                      fallback={
                        <div className="w-full h-full bg-slate-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs">🔫</span>
                        </div>
                      }
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs">🔫</span>
                    </div>
                  )}
                </div>
                
                {/* Название */}
                <div className="text-white text-xs text-center leading-tight">
                  {item.reward_type === 'coin_reward' 
                    ? `${item.displayData?.amount || 0}₽`
                    : (item.displayData?.name || 'Item')
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Подсветка по краям для эффекта */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-5"></div>
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-5"></div>
    </div>
  );
};

export default CaseRoulette;
