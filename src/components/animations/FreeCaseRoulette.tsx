
import { useState, useEffect, useRef } from "react";
import { useSound } from "@/hooks/useSound";
import { useVibration } from "@/hooks/useVibration";
import LazyImage from "@/components/ui/LazyImage";

interface FreeCaseRouletteProps {
  caseSkins: any[];
  onComplete: (result: { type: 'skin' | 'coins', skin?: any, coins?: number }) => void;
}

const FreeCaseRoulette = ({ caseSkins, onComplete }: FreeCaseRouletteProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playRouletteSpinSound, playItemRevealSound, playCoinsEarnedSound } = useSound();
  const { vibrateSuccess, vibrateRare } = useVibration();

  console.log('🎰 [FREE_CASE_ROULETTE] Component mounted with caseSkins:', caseSkins?.length);

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
    console.log('🎰 [FREE_CASE_ROULETTE] Setting up roulette with caseSkins:', caseSkins?.length);
    
    if (!caseSkins?.length) {
      console.log('🎰 [FREE_CASE_ROULETTE] No case skins provided, using fallback');
      setTimeout(() => onComplete({ type: 'coins', coins: 50 }), 1000);
      return;
    }

    // Создаем массив предметов для рулетки (скины + монеты)
    const rouletteItems = [];
    const totalItems = 100;
    const winnerPosition = Math.floor(totalItems * 0.85);

    // Определяем что выпадет (30% шанс на монеты)
    const willDropCoins = Math.random() < 0.3;
    let winner;

    if (willDropCoins) {
      winner = {
        type: 'coins',
        coins: Math.floor(Math.random() * 200) + 50, // 50-250 монет
        name: 'Монеты',
        rarity: 'coins'
      };
      console.log('🪙 [FREE_CASE_ROULETTE] Winner will be coins:', winner.coins);
    } else {
      // Выбираем случайный скин из кейса
      const availableSkins = caseSkins.filter(item => item.skins && !item.never_drop);
      
      if (availableSkins.length === 0) {
        console.log('⚠️ [FREE_CASE_ROULETTE] No available skins, fallback to coins');
        winner = {
          type: 'coins',
          coins: 100,
          name: 'Монеты',
          rarity: 'coins'
        };
      } else {
        const totalProbability = availableSkins.reduce((sum, item) => {
          return sum + (item.custom_probability || item.probability || 0.01);
        }, 0);
        
        let random = Math.random() * totalProbability;
        let selectedSkin = availableSkins[0];

        for (const skin of availableSkins) {
          const probability = skin.custom_probability || skin.probability || 0.01;
          random -= probability;
          if (random <= 0) {
            selectedSkin = skin;
            break;
          }
        }

        winner = {
          type: 'skin',
          ...selectedSkin.skins,
          rarity: selectedSkin.skins.rarity
        };
        console.log('🔫 [FREE_CASE_ROULETTE] Winner will be skin:', winner.name);
      }
    }

    // Заполняем рулетку
    for (let i = 0; i < totalItems; i++) {
      if (i === winnerPosition) {
        rouletteItems.push(winner);
      } else {
        if (Math.random() < 0.3) {
          // Добавляем монеты
          rouletteItems.push({
            type: 'coins',
            coins: Math.floor(Math.random() * 150) + 25,
            name: 'Монеты',
            rarity: 'coins'
          });
        } else {
          // Добавляем случайный скин
          const availableSkins = caseSkins.filter(item => item.skins);
          if (availableSkins.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableSkins.length);
            const randomSkin = availableSkins[randomIndex]?.skins;
            if (randomSkin) {
              rouletteItems.push({
                type: 'skin',
                ...randomSkin,
                rarity: randomSkin.rarity
              });
            }
          } else {
            // Fallback to coins if no skins available
            rouletteItems.push({
              type: 'coins',
              coins: Math.floor(Math.random() * 100) + 25,
              name: 'Монеты',
              rarity: 'coins'
            });
          }
        }
      }
    }

    console.log('🎰 [FREE_CASE_ROULETTE] Roulette items prepared:', rouletteItems.length);
    setItems(rouletteItems);

    // Запускаем анимацию
    const timer1 = setTimeout(() => {
      console.log('🎰 [FREE_CASE_ROULETTE] Starting spin animation');
      setIsSpinning(true);
      playRouletteSpinSound();
      
      if (scrollRef.current) {
        const itemWidth = 140;
        const finalPosition = winnerPosition * itemWidth - (window.innerWidth / 2) + (itemWidth / 2);
        
        scrollRef.current.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        scrollRef.current.style.transform = `translateX(-${finalPosition}px)`;
      }
    }, 500);

    const timer2 = setTimeout(() => {
      console.log('🎰 [FREE_CASE_ROULETTE] Animation completed, revealing winner');
      setIsComplete(true);
      
      if (winner.type === 'coins') {
        playCoinsEarnedSound();
        vibrateSuccess();
        onComplete({ type: 'coins', coins: winner.coins });
      } else {
        const rarity = winner.rarity?.toLowerCase();
        if (rarity === 'legendary' || rarity === 'mythical' || rarity === 'immortal') {
          vibrateRare();
        } else {
          vibrateSuccess();
        }
        playItemRevealSound();
        onComplete({ type: 'skin', skin: winner });
      }
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [caseSkins, onComplete, playRouletteSpinSound, playItemRevealSound, playCoinsEarnedSound, vibrateSuccess, vibrateRare]);

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
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text mb-2">
          🎁 БЕСПЛАТНАЯ РУЛЕТКА!
        </h2>
        <p className="text-slate-400 text-lg">Определяем ваш выигрыш...</p>
      </div>
      
      {/* Контейнер рулетки */}
      <div className="relative">
        {/* Указатель */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex flex-col items-center">
            <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-blue-500 shadow-lg"></div>
            <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-green-500 drop-shadow-lg"></div>
          </div>
        </div>

        {/* Градиенты по краям */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
        
        {/* Рулетка */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl border-4 border-green-500/70 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
          
          <div
            ref={scrollRef}
            className="flex items-center py-6 px-4"
            style={{ transform: 'translateX(0px)' }}
          >
            {items.map((item, index) => {
              const isWinner = index === Math.floor(items.length * 0.85);
              
              if (item.type === 'coins') {
                return (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-32 h-40 mx-2 bg-gradient-to-br from-yellow-500 to-orange-500 border-yellow-400 rounded-xl p-3 flex flex-col items-center justify-center border-2 relative overflow-hidden ${
                      isWinner ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-lg shadow-yellow-400/50' : ''
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/10 animate-pulse"></div>
                    <div className="text-4xl mb-2 relative z-10">🪙</div>
                    <div className="text-white text-lg font-bold mb-1 relative z-10">{item.coins}</div>
                    <div className="text-yellow-300 text-sm font-bold relative z-10">монет</div>
                  </div>
                );
              }
              
              const rarityClass = getRarityColor(item.rarity);
              
              return (
                <div
                  key={index}
                  className={`flex-shrink-0 w-32 h-40 mx-2 bg-gradient-to-br ${rarityClass} rounded-xl p-3 flex flex-col items-center justify-between border-2 relative overflow-hidden ${
                    isWinner ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-lg shadow-yellow-400/50' : ''
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/10 animate-pulse"></div>
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rarityClass.split(' ')[0]} ${rarityClass.split(' ')[1]}`}></div>
                  
                  <div className="w-full h-24 flex items-center justify-center bg-black/30 rounded-lg mb-2 relative">
                    {item?.image_url ? (
                      <LazyImage
                        src={item.image_url}
                        alt={item.name || 'Скин'}
                        className="w-full h-full object-contain rounded"
                        fallback={<div className="text-3xl">🔫</div>}
                      />
                    ) : (
                      <div className="text-3xl">🔫</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
                  </div>
                  
                  <div className="text-center w-full">
                    <div className="text-white text-xs font-bold leading-tight line-clamp-2 mb-1">
                      {item?.name?.substring(0, 16) || 'Скин'}
                    </div>
                    <div className="text-xs text-slate-300 opacity-75">
                      {item?.weapon_type?.substring(0, 12) || 'Оружие'}
                    </div>
                  </div>
                  
                  <div className="text-yellow-400 text-xs font-bold">
                    {item?.price || 0}₽
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
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-150"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-300"></div>
            </div>
          )}
        </div>
        
        <p className="text-xl font-bold text-transparent bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text animate-pulse">
          {!isSpinning && 'Подготовка...'}
          {isSpinning && !isComplete && 'Крутим рулетку! 🎰'}
          {isComplete && 'Поздравляем с выигрышем! 🎉'}
        </p>
      </div>
    </div>
  );
};

export default FreeCaseRoulette;
