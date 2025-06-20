
import { useState, useEffect, useRef } from "react";
import LazyImage from "@/components/ui/LazyImage";

interface NewCaseRouletteProps {
  caseSkins: any[];
  wonSkin: any;
  onComplete: () => void;
}

const NewCaseRoulette = ({ caseSkins, wonSkin, onComplete }: NewCaseRouletteProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'consumer grade':
      case 'consumer':
        return 'from-gray-500 to-gray-600 border-gray-400';
      case 'industrial grade':
      case 'industrial':
        return 'from-blue-500 to-blue-600 border-blue-400';
      case 'mil-spec':
        return 'from-purple-500 to-purple-600 border-purple-400';
      case 'restricted':
        return 'from-pink-500 to-pink-600 border-pink-400';
      case 'classified':
        return 'from-red-500 to-red-600 border-red-400';
      case 'covert':
        return 'from-orange-500 to-orange-600 border-orange-400';
      case 'contraband':
        return 'from-yellow-500 to-yellow-600 border-yellow-400';
      default:
        return 'from-gray-500 to-gray-600 border-gray-400';
    }
  };

  useEffect(() => {
    if (!caseSkins || !wonSkin) {
      setTimeout(onComplete, 1000);
      return;
    }

    // Создаем массив предметов для рулетки
    const rouletteItems = [];
    const totalItems = 100;
    const winnerPosition = Math.floor(totalItems * 0.85); // Победитель в конце

    for (let i = 0; i < totalItems; i++) {
      if (i === winnerPosition) {
        rouletteItems.push(wonSkin);
      } else {
        const randomIndex = Math.floor(Math.random() * caseSkins.length);
        const randomSkin = caseSkins[randomIndex]?.skins || wonSkin;
        rouletteItems.push(randomSkin);
      }
    }

    setItems(rouletteItems);

    // Запускаем анимацию
    const timer1 = setTimeout(() => {
      setIsSpinning(true);
      
      if (scrollRef.current) {
        const itemWidth = 140; // Ширина одного предмета
        const finalPosition = winnerPosition * itemWidth - (window.innerWidth / 2) + (itemWidth / 2);
        
        scrollRef.current.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        scrollRef.current.style.transform = `translateX(-${finalPosition}px)`;
      }
    }, 500);

    const timer2 = setTimeout(() => {
      setIsComplete(true);
      setTimeout(onComplete, 1500);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [caseSkins, wonSkin, onComplete]);

  if (!items.length) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-white text-xl">Подготовка рулетки...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 bg-gradient-to-b from-slate-900 to-black min-h-[500px]">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text mb-2">
          🎰 КРУТИ РУЛЕТКУ!
        </h2>
        <p className="text-slate-400 text-lg">Определяем ваш выигрыш...</p>
      </div>
      
      {/* Контейнер рулетки */}
      <div className="relative">
        {/* Указатель */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex flex-col items-center">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 shadow-lg"></div>
            <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-orange-500 drop-shadow-lg"></div>
          </div>
        </div>

        {/* Градиенты по краям */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
        
        {/* Рулетка */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl border-4 border-orange-500/70 shadow-2xl">
          {/* Верхняя и нижняя подсветка */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-purple-500"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-purple-500"></div>
          
          {/* Полоса предметов */}
          <div
            ref={scrollRef}
            className="flex items-center py-6 px-4"
            style={{ transform: 'translateX(0px)' }}
          >
            {items.map((skin, index) => {
              const isWinner = index === Math.floor(items.length * 0.85);
              const rarityClass = getRarityColor(skin.rarity);
              
              return (
                <div
                  key={index}
                  className={`flex-shrink-0 w-32 h-40 mx-2 bg-gradient-to-br ${rarityClass} rounded-xl p-3 flex flex-col items-center justify-between border-2 relative overflow-hidden ${
                    isWinner ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-lg shadow-yellow-400/50' : ''
                  }`}
                >
                  {/* Эффект свечения для победителя */}
                  {isWinner && (
                    <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 via-transparent to-yellow-400/20 animate-pulse"></div>
                  )}
                  
                  {/* Редкость полоска */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rarityClass.split(' ')[0]} ${rarityClass.split(' ')[1]}`}></div>
                  
                  {/* Изображение скина */}
                  <div className="w-full h-24 flex items-center justify-center bg-black/30 rounded-lg mb-2 relative">
                    {skin?.image_url ? (
                      <LazyImage
                        src={skin.image_url}
                        alt={skin.name || 'Скин'}
                        className="w-full h-full object-contain rounded"
                        fallback={<div className="text-3xl">🔫</div>}
                      />
                    ) : (
                      <div className="text-3xl">🔫</div>
                    )}
                    
                    {/* Эффект блеска */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
                  </div>
                  
                  {/* Название скина */}
                  <div className="text-center w-full">
                    <div className="text-white text-xs font-bold leading-tight line-clamp-2 mb-1">
                      {skin?.name?.substring(0, 16) || 'Скин'}
                    </div>
                    <div className="text-xs text-slate-300 opacity-75">
                      {skin?.weapon_type?.substring(0, 12) || 'Оружие'}
                    </div>
                  </div>
                  
                  {/* Цена */}
                  <div className="text-yellow-400 text-xs font-bold">
                    {skin?.price || 0}₽
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Статус */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          {!isSpinning && (
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce delay-150"></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce delay-300"></div>
            </div>
          )}
        </div>
        
        <p className="text-xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text animate-pulse">
          {!isSpinning && 'Подготовка...'}
          {isSpinning && !isComplete && 'Крутим рулетку! 🎰'}
          {isComplete && 'Поздравляем с выигрышем! 🎉'}
        </p>
      </div>
    </div>
  );
};

export default NewCaseRoulette;
