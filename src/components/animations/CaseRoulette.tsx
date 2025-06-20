
import { useState, useEffect } from "react";
import LazyImage from "@/components/ui/LazyImage";

interface CaseRouletteProps {
  caseSkins: any[];
  wonSkin: any;
  onComplete: () => void;
}

const CaseRoulette = ({ caseSkins, wonSkin, onComplete }: CaseRouletteProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    console.log('CaseRoulette: Initializing');
    
    if (!caseSkins || !wonSkin) {
      console.error('CaseRoulette: Missing required props');
      setTimeout(onComplete, 1000);
      return;
    }

    // Создаем простой массив предметов
    const rouletteItems = [];
    for (let i = 0; i < 10; i++) {
      if (i === 5) {
        rouletteItems.push(wonSkin);
      } else {
        const randomIndex = Math.floor(Math.random() * caseSkins.length);
        rouletteItems.push(caseSkins[randomIndex]?.skins || wonSkin);
      }
    }
    
    setItems(rouletteItems);

    // Запускаем анимацию
    const startTimer = setTimeout(() => {
      setIsSpinning(true);
    }, 500);

    const endTimer = setTimeout(() => {
      setIsSpinning(false);
      setTimeout(onComplete, 1000);
    }, 3000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [caseSkins, wonSkin, onComplete]);

  if (!items.length) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-white text-xl">Подготовка рулетки...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 bg-slate-900">
      <h2 className="text-3xl font-bold text-white text-center">Рулетка!</h2>
      
      <div className="relative overflow-hidden bg-slate-800 rounded-lg border-2 border-orange-500/50">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[20px] border-l-transparent border-r-transparent border-b-orange-500"></div>
        </div>
        
        <div className={`flex transition-transform duration-2000 ease-out ${isSpinning ? '-translate-x-1/2' : ''}`}>
          {items.map((item, index) => (
            <div key={index} className="flex-shrink-0 w-32 h-32 border border-slate-600 p-2 flex flex-col items-center justify-center bg-slate-700">
              <div className="w-full h-2/3 flex items-center justify-center mb-1">
                {item?.image_url ? (
                  <LazyImage
                    src={item.image_url}
                    alt={item.name || 'Скин'}
                    className="w-full h-full object-contain"
                    fallback={<div className="text-2xl">🔫</div>}
                  />
                ) : (
                  <div className="text-2xl">🔫</div>
                )}
              </div>
              <div className="text-white text-xs text-center truncate w-full">
                {item?.name?.substring(0, 12) || 'Скин'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-yellow-400 text-xl font-semibold text-center animate-pulse">
        {isSpinning ? 'Определяем победителя...' : 'Результат готов!'}
      </p>
    </div>
  );
};

export default CaseRoulette;
