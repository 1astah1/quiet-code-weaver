
import { useState, useEffect } from "react";

interface CaseRevealingPhaseProps {
  caseSkins: any[];
  wonSkin: any;
  onComplete: () => void;
}

const CaseRevealingPhase = ({ caseSkins, wonSkin, onComplete }: CaseRevealingPhaseProps) => {
  const [isSpinning, setIsSpinning] = useState(true);
  const [finalPosition, setFinalPosition] = useState(0);

  useEffect(() => {
    if (!caseSkins?.length || !wonSkin) return;

    // Создаем массив скинов для рулетки (повторяем для плавной прокрутки)
    const rouletteItems = [];
    const repeatCount = 8; // Количество повторений для длинной прокрутки
    
    for (let i = 0; i < repeatCount; i++) {
      rouletteItems.push(...caseSkins);
    }

    // Находим позицию выигрышного скина в последнем повторении
    const wonSkinIndex = caseSkins.findIndex(item => 
      item.skins?.id === wonSkin.id
    );
    
    if (wonSkinIndex === -1) return;

    // Позиция выигрышного скина в рулетке
    const finalIndex = (repeatCount - 1) * caseSkins.length + wonSkinIndex;
    const itemWidth = 120; // Ширина одного элемента
    const containerWidth = 400; // Ширина контейнера
    const centerOffset = containerWidth / 2 - itemWidth / 2;
    
    // Финальная позиция для центрирования выигрышного скина
    const targetPosition = -(finalIndex * itemWidth - centerOffset);
    
    setFinalPosition(targetPosition);

    // Запускаем анимацию
    setTimeout(() => {
      setIsSpinning(false);
      setTimeout(() => {
        onComplete();
      }, 1000); // Пауза для показа результата
    }, 3000); // Длительность прокрутки

  }, [caseSkins, wonSkin, onComplete]);

  if (!caseSkins?.length) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  // Создаем расширенный массив для рулетки
  const rouletteItems = [];
  const repeatCount = 8;
  
  for (let i = 0; i < repeatCount; i++) {
    rouletteItems.push(...caseSkins);
  }

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Индикатор центра */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-1 h-16 bg-orange-500 shadow-lg shadow-orange-500/50"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-orange-500"></div>
        </div>
      </div>

      {/* Контейнер рулетки */}
      <div className="w-full max-w-md overflow-hidden relative">
        <div 
          className={`flex transition-transform ease-out ${
            isSpinning ? 'duration-3000' : 'duration-1000'
          }`}
          style={{
            transform: `translateX(${isSpinning ? -200 : finalPosition}px)`
          }}
        >
          {rouletteItems.map((item, index) => (
            <div
              key={`${item.skins?.id}-${index}`}
              className="flex-shrink-0 w-28 h-32 mx-1 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg border border-slate-600 flex flex-col items-center justify-center relative"
              style={{
                borderColor: item.skins?.rarity === 'legendary' ? '#f59e0b' :
                           item.skins?.rarity === 'epic' ? '#8b5cf6' :
                           item.skins?.rarity === 'rare' ? '#3b82f6' :
                           item.skins?.rarity === 'uncommon' ? '#10b981' : '#6b7280'
              }}
            >
              {item.skins?.image_url ? (
                <img
                  src={item.skins.image_url}
                  alt={item.skins.name}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-600 rounded flex items-center justify-center">
                  <span className="text-slate-400 text-xs">No img</span>
                </div>
              )}
              <p className="text-white text-xs mt-2 text-center px-1 truncate w-full">
                {item.skins?.name || 'Unknown'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Подсветка по краям */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-5"></div>
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-5"></div>

      {/* Текст состояния */}
      <div className="mt-6 text-center">
        <p className="text-white text-lg font-medium">
          {isSpinning ? 'Прокручиваем...' : 'Результат!'}
        </p>
      </div>
    </div>
  );
};

export default CaseRevealingPhase;
