
import { useState, useEffect } from "react";
import CaseRoulette from "./CaseRoulette";

interface CaseRevealingPhaseProps {
  caseSkins?: any[];
  wonSkin?: any;
  onComplete?: () => void;
}

const CaseRevealingPhase = ({ caseSkins, wonSkin, onComplete }: CaseRevealingPhaseProps) => {
  const [revealPhase, setRevealPhase] = useState<'analyzing' | 'roulette' | 'finalizing'>('analyzing');

  useEffect(() => {
    if (!caseSkins || !wonSkin || !onComplete) {
      console.error('Missing required props for revealing phase');
      return;
    }

    // Фаза анализа (1 секунда)
    const timer1 = setTimeout(() => {
      setRevealPhase('roulette');
    }, 1000);

    // Переход к финализации через 4 секунды после начала рулетки
    const timer2 = setTimeout(() => {
      setRevealPhase('finalizing');
      setTimeout(onComplete, 500);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [caseSkins, wonSkin, onComplete]);

  if (revealPhase === 'roulette' && caseSkins && wonSkin && onComplete) {
    return <CaseRoulette caseSkins={caseSkins} wonSkin={wonSkin} onComplete={() => {}} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 text-center">
        {revealPhase === 'analyzing' && 'Анализ содержимого...'}
        {revealPhase === 'finalizing' && 'Финализация выигрыша...'}
      </h2>
      
      <div className="relative flex justify-center">
        {/* Кристаллическая матрица */}
        <div className="w-24 sm:w-32 md:w-40 h-24 sm:h-32 md:h-40 relative">
          {/* Центральный кристалл */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl md:text-5xl shadow-2xl shadow-cyan-500/50 animate-pulse transform rotate-12">
            💎
          </div>
          
          {/* Орбитальные кристаллы */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-lg shadow-lg animate-pulse"
              style={{
                left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 60}%`,
                top: `${50 + Math.sin(i * 60 * Math.PI / 180) * 60}%`,
                animationDelay: `${i * 0.2}s`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-full h-full bg-white/30 rounded-lg animate-ping" />
            </div>
          ))}
        </div>
        
        {/* Сканирующие лучи */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 border-4 border-transparent border-t-cyan-400 border-r-cyan-400 rounded-full animate-spin"></div>
          <div className="absolute w-24 sm:w-32 md:w-40 h-24 sm:h-32 md:h-40 border-2 border-transparent border-b-purple-400 border-l-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-cyan-300 text-sm sm:text-lg md:text-xl font-semibold animate-pulse">
          {revealPhase === 'analyzing' && 'Сканирование матрицы...'}
          {revealPhase === 'finalizing' && 'Калибровка результата...'}
        </p>
        
        {/* Индикатор прогресса */}
        <div className="w-48 sm:w-64 mx-auto bg-slate-700 rounded-full h-2 overflow-hidden">
          <div className={`h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-1000 ${
            revealPhase === 'analyzing' ? 'w-1/3' : 'w-full'
          }`} />
        </div>
      </div>
    </div>
  );
};

export default CaseRevealingPhase;
