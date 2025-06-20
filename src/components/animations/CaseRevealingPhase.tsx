
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
    // Фаза анализа (1.5 секунды)
    const timer1 = setTimeout(() => {
      setRevealPhase('roulette');
    }, 1500);

    // Переход к финализации через 4 секунды после начала рулетки
    const timer2 = setTimeout(() => {
      setRevealPhase('finalizing');
    }, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (revealPhase === 'roulette' && caseSkins && wonSkin && onComplete) {
    return <CaseRoulette caseSkins={caseSkins} wonSkin={wonSkin} onComplete={onComplete} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 text-center">
        {revealPhase === 'analyzing' && 'Анализ содержимого...'}
        {revealPhase === 'finalizing' && 'Финализация выигрыша...'}
      </h2>
      
      <div className="relative flex justify-center">
        {/* Кристаллическая матрица */}
        <div className="w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 relative">
          {/* Центральный кристалл */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl md:text-6xl shadow-2xl shadow-cyan-500/50 animate-pulse transform rotate-12">
            💎
          </div>
          
          {/* Орбитальные кристаллы */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-lg shadow-lg animate-pulse"
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
          <div className="w-40 sm:w-48 md:w-56 h-40 sm:h-48 md:h-56 border-4 border-transparent border-t-cyan-400 border-r-cyan-400 rounded-full animate-spin"></div>
          <div className="absolute w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 border-2 border-transparent border-b-purple-400 border-l-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>

        {/* Энергетические волны */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border border-cyan-400/20 rounded-full animate-ping" />
          <div className="absolute w-80 h-80 border border-blue-400/15 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="absolute w-96 h-96 border border-purple-400/10 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <p className="text-cyan-300 text-lg sm:text-xl md:text-2xl font-semibold animate-pulse">
          {revealPhase === 'analyzing' && 'Сканирование матрицы вероятностей...'}
          {revealPhase === 'finalizing' && 'Калибровка результата...'}
        </p>
        
        {/* Индикатор прогресса */}
        <div className="w-64 mx-auto bg-slate-700 rounded-full h-2 overflow-hidden">
          <div className={`h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-1000 ${
            revealPhase === 'analyzing' ? 'w-1/3' : 'w-full'
          }`} />
        </div>
      </div>

      {/* Частицы данных */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-cyan-400/30 text-xs font-mono animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`
            }}
          >
            {Math.random() > 0.5 ? '1' : '0'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseRevealingPhase;
