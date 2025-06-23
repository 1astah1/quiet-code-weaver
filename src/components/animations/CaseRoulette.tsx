
import { useState, useEffect } from "react";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface CaseRouletteProps {
  caseSkins: any[];
  onComplete: (selectedReward: any) => void;
  selectRandomReward: (rewards: any[]) => any;
}

const CaseRoulette = ({ caseSkins, onComplete, selectRandomReward }: CaseRouletteProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [rouletteItems, setRouletteItems] = useState<any[]>([]);

  console.log('CaseRoulette: Rendering with', caseSkins.length, 'items');

  useEffect(() => {
    // Создаем расширенный список для рулетки (дублируем items для визуального эффекта)
    const expandedItems = [];
    const itemsToShow = 50; // Количество элементов в рулетке
    
    for (let i = 0; i < itemsToShow; i++) {
      const randomItem = caseSkins[Math.floor(Math.random() * caseSkins.length)];
      expandedItems.push({
        ...randomItem,
        id: `roulette-${i}`,
        displayData: randomItem.reward_type === 'coin_reward' ? randomItem.coin_rewards : randomItem.skins
      });
    }
    
    setRouletteItems(expandedItems);
    
    // Запускаем рулетку через небольшую задержку
    setTimeout(() => {
      startRoulette();
    }, 1000);
  }, [caseSkins]);

  const startRoulette = () => {
    console.log('🎰 Starting roulette');
    setIsSpinning(true);
    
    // Выбираем случайную награду по вероятностям
    const selected = selectRandomReward(caseSkins);
    console.log('🎯 Selected reward for roulette:', selected);
    
    if (selected) {
      setSelectedReward(selected);
      
      // Анимация длится 4 секунды
      setTimeout(() => {
        setIsSpinning(false);
        // Еще секунда показа результата
        setTimeout(() => {
          onComplete(selected);
        }, 1000);
      }, 4000);
    }
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
          className={`flex h-full transition-transform duration-4000 ease-out ${
            isSpinning ? 'transform translate-x-[-80%]' : ''
          }`}
          style={{
            transform: isSpinning ? 'translateX(-80%)' : 'translateX(0)',
          }}
        >
          {rouletteItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex-shrink-0 w-24 h-32 border-r border-slate-700 flex flex-col items-center justify-center p-2 relative"
              style={{
                backgroundColor: item.displayData?.rarity ? 
                  getRarityColor(item.displayData.rarity) + '20' : 
                  '#374151'
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
          ))}
        </div>
      </div>

      {/* Информация о выбранной награде */}
      {selectedReward && !isSpinning && (
        <div className="mt-8 text-center">
          <div className="text-white text-xl mb-4">Выпало:</div>
          <div className="bg-slate-800 rounded-lg p-6 border-2 border-orange-500/50">
            <div className="w-24 h-24 mx-auto mb-4">
              {selectedReward.reward_type === 'coin_reward' ? (
                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">₽</span>
                </div>
              ) : selectedReward.skins?.image_url ? (
                <OptimizedImage
                  src={selectedReward.skins.image_url}
                  alt={selectedReward.skins.name || 'Item'}
                  className="w-full h-full object-contain"
                  fallback={
                    <div className="w-full h-full bg-slate-600 rounded flex items-center justify-center">
                      <span className="text-white text-2xl">🔫</span>
                    </div>
                  }
                />
              ) : (
                <div className="w-full h-full bg-slate-600 rounded flex items-center justify-center">
                  <span className="text-white text-2xl">🔫</span>
                </div>
              )}
            </div>
            <div className="text-white text-lg font-bold">
              {selectedReward.reward_type === 'coin_reward' 
                ? `${selectedReward.coin_rewards?.amount || 0} монет`
                : selectedReward.skins?.name || 'Неизвестный предмет'
              }
            </div>
            {selectedReward.skins?.rarity && (
              <div 
                className="text-sm font-semibold mt-2"
                style={{ color: getRarityColor(selectedReward.skins.rarity) }}
              >
                {selectedReward.skins.rarity}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseRoulette;
