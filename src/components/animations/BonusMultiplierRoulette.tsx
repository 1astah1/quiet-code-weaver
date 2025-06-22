
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/useSound";
import { useVibration } from "@/hooks/useVibration";

interface BonusMultiplierRouletteProps {
  baseCoins: number;
  onMultiplierSelected: (multiplier: number, finalCoins: number) => void;
  onSkip: () => void;
}

const BonusMultiplierRoulette = ({ baseCoins, onMultiplierSelected, onSkip }: BonusMultiplierRouletteProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playRouletteSpinSound, playMultiplierWinSound } = useSound();
  const { vibrateSuccess, vibrateRare } = useVibration();

  // Множители от 5% до 80% (1.05 до 1.8)
  const multipliers = [
    1.05, 1.08, 1.12, 1.15, 1.18, 1.22, 1.25, 1.28, 1.32, 1.35,
    1.38, 1.42, 1.45, 1.48, 1.52, 1.55, 1.58, 1.62, 1.65, 1.68,
    1.72, 1.75, 1.78, 1.82, 1.85, 1.88, 1.92, 1.95, 1.98, 1.8
  ];

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 1.7) return 'from-yellow-500 to-orange-500 border-yellow-400'; // Очень хороший
    if (multiplier >= 1.5) return 'from-red-500 to-pink-500 border-red-400'; // Хороший
    if (multiplier >= 1.3) return 'from-purple-500 to-blue-500 border-purple-400'; // Средний
    return 'from-green-500 to-teal-500 border-green-400'; // Небольшой
  };

  const spinRoulette = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    playRouletteSpinSound();
    
    // Выбираем случайный множитель с весами
    const weights = multipliers.map(m => {
      if (m >= 1.7) return 1; // 1% шанс для больших множителей
      if (m >= 1.5) return 3; // 3% шанс  
      if (m >= 1.3) return 8; // 8% шанс
      return 20; // 20% шанс для маленьких
    });
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    let winnerIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        winnerIndex = i;
        break;
      }
    }
    
    const winner = multipliers[winnerIndex];
    
    // Анимация прокрутки
    if (scrollRef.current) {
      const itemWidth = 120;
      const finalPosition = winnerIndex * itemWidth - (window.innerWidth / 2) + (itemWidth / 2);
      
      scrollRef.current.style.transition = 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      scrollRef.current.style.transform = `translateX(-${finalPosition}px)`;
    }
    
    setTimeout(() => {
      setSelectedMultiplier(winner);
      setIsSpinning(false);
      setShowResult(true);
      
      // Звук и вибрация в зависимости от множителя
      if (winner >= 1.5) {
        vibrateRare();
        playMultiplierWinSound();
      } else {
        vibrateSuccess();
        playMultiplierWinSound();
      }
    }, 3000);
  };

  const handleTakeReward = () => {
    if (selectedMultiplier) {
      const finalCoins = Math.floor(baseCoins * selectedMultiplier);
      onMultiplierSelected(selectedMultiplier, finalCoins);
    }
  };

  return (
    <div className="space-y-6 p-4 bg-gradient-to-b from-purple-900 to-black min-h-[500px]">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-600 bg-clip-text mb-2">
          🎰 БОНУСНАЯ РУЛЕТКА!
        </h2>
        <p className="text-slate-400 text-lg mb-2">Увеличьте свой выигрыш от 5% до 80%!</p>
        <div className="text-2xl font-bold text-yellow-400">
          Базовый выигрыш: {baseCoins} монет
        </div>
      </div>

      {!showResult && (
        <>
          {/* Контейнер рулетки */}
          <div className="relative">
            {/* Указатель */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex flex-col items-center">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 shadow-lg"></div>
                <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-purple-500 drop-shadow-lg"></div>
              </div>
            </div>

            {/* Градиенты по краям */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
            
            {/* Рулетка */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-800 via-purple-700 to-purple-800 rounded-2xl border-4 border-purple-500/70 shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"></div>
              
              <div
                ref={scrollRef}
                className="flex items-center py-6 px-4"
                style={{ transform: 'translateX(0px)' }}
              >
                {multipliers.map((multiplier, index) => {
                  const isWinner = index === Math.floor(multipliers.length * 0.85);
                  const rarityClass = getMultiplierColor(multiplier);
                  const bonusPercent = Math.round((multiplier - 1) * 100);
                  
                  return (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-28 h-32 mx-2 bg-gradient-to-br ${rarityClass} rounded-xl p-3 flex flex-col items-center justify-center border-2 relative overflow-hidden ${
                        isWinner ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-lg shadow-yellow-400/50' : ''
                      }`}
                    >
                      {/* Эффект свечения */}
                      <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/10 animate-pulse"></div>
                      
                      {/* Множитель */}
                      <div className="text-white text-xl font-bold mb-1 relative z-10">
                        +{bonusPercent}%
                      </div>
                      
                      {/* Результат */}
                      <div className="text-yellow-300 text-sm font-bold relative z-10">
                        {Math.floor(baseCoins * multiplier)}
                      </div>
                      
                      {/* Иконка в зависимости от процента */}
                      <div className="text-lg relative z-10">
                        {bonusPercent >= 70 ? '🌟' : bonusPercent >= 50 ? '💎' : bonusPercent >= 30 ? '🔥' : '✨'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={spinRoulette}
              disabled={isSpinning}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-bold"
            >
              {isSpinning ? 'Крутим...' : '📺 Посмотреть рекламу и крутить'}
            </Button>
            
            <Button
              onClick={onSkip}
              variant="outline"
              className="border-gray-500 text-gray-300 hover:text-white hover:border-gray-400 px-8 py-4 text-lg"
            >
              Забрать {baseCoins} монет
            </Button>
          </div>
        </>
      )}

      {showResult && selectedMultiplier && (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 rounded-2xl p-8 border border-purple-500/50">
            <h3 className="text-3xl font-bold text-white mb-4">🎉 Поздравляем!</h3>
            
            <div className="text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text mb-4">
              +{Math.round((selectedMultiplier - 1) * 100)}%
            </div>
            
            <div className="text-xl text-slate-300 mb-2">
              {baseCoins} × {selectedMultiplier.toFixed(2)} =
            </div>
            
            <div className="text-4xl font-bold text-yellow-400 mb-6">
              {Math.floor(baseCoins * selectedMultiplier)} монет!
            </div>
            
            <Button
              onClick={handleTakeReward}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-bold"
            >
              Забрать награду!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusMultiplierRoulette;
