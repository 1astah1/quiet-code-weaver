import { useEffect, useRef, useState } from 'react';
import type { CS2RouletteItem } from '@/hooks/useCS2CaseOpening';

interface CS2CaseRouletteProps {
  items: CS2RouletteItem[];
  winnerPosition: number;
  onComplete: () => void;
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

export const CS2CaseRoulette = ({ items, winnerPosition, onComplete }: CS2CaseRouletteProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!items || items.length === 0) return;
    setIsSpinning(true);
    // Анимация: прокрутка к winnerPosition (центр)
    const itemWidth = 128; // px
    const itemMargin = 12; // px
    const totalItemWidth = itemWidth + itemMargin;
    const visibleCount = 7; // сколько видно предметов
    const centerIndex = Math.floor(visibleCount / 2);
    const targetIndex = items.length + winnerPosition - centerIndex;
    const finalPosition = -(targetIndex * totalItemWidth);
    setTimeout(() => setTranslateX(finalPosition), 300);
    // Завершение анимации
    const timer = setTimeout(() => {
      setIsSpinning(false);
      onComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [items, winnerPosition, onComplete]);

  return (
    <div className="relative w-full max-w-5xl mx-auto py-8">
      {/* Стрелка */}
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
        <div className="w-0 h-0 border-l-[24px] border-r-[24px] border-b-[32px] border-l-transparent border-r-transparent border-b-orange-500 drop-shadow-xl"></div>
      </div>
      {/* Рулетка */}
      <div className="overflow-hidden bg-slate-900 rounded-xl border-2 border-orange-500/60 h-40 relative">
        <div
          ref={containerRef}
          className="flex items-center transition-transform duration-[3200ms] ease-out"
          style={{
            transform: `translateX(${translateX}px)`
          }}
        >
          {/* Утраиваем массив для плавной анимации */}
          {[...items, ...items, ...items].map((item, idx) => {
            const isWinner = idx === items.length * 1 + winnerPosition;
            const rarity = item.rarity?.toLowerCase() || 'consumer';
            return (
              <div
                key={item.id + '-' + idx}
                className={`flex-shrink-0 w-32 h-32 mx-1 bg-slate-800 border-4 ${RARITY_COLORS[rarity] || 'border-gray-500'} rounded-xl flex flex-col items-center justify-center relative shadow-lg ${isWinner ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''}`}
              >
                {/* Вспышка для победителя */}
                {isWinner && (
                  <div className="absolute inset-0 bg-yellow-300/30 rounded-xl animate-pulse pointer-events-none"></div>
                )}
                {/* Изображение */}
                <div className="w-20 h-20 flex items-center justify-center mb-1">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-4xl">🔫</span>
                  )}
                </div>
                {/* Название */}
                <div className="text-white text-xs text-center truncate w-full">
                  {item.name}
                </div>
                {/* Цена */}
                <div className="text-yellow-400 text-xs font-bold">{item.price} монет</div>
                {/* Редкость */}
                <div className="text-xs uppercase text-slate-400 mt-1">{item.rarity}</div>
                {/* Эффект для редких */}
                {['covert', 'legendary', 'mythical'].includes(rarity) && (
                  <div className="absolute inset-0 border-2 border-yellow-400 rounded-xl animate-pulse pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Тень и вспышка */}
      <div className="absolute left-1/2 top-0 w-32 h-40 -translate-x-1/2 pointer-events-none z-30">
        <div className="w-full h-full bg-gradient-to-b from-yellow-200/40 via-transparent to-transparent rounded-xl blur-lg animate-pulse"></div>
      </div>
    </div>
  );
};

export default CS2CaseRoulette; 