
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
    console.log('CaseRevealingPhase: Starting reveal sequence', { caseSkins: !!caseSkins, wonSkin: !!wonSkin });
    
    if (!caseSkins || !wonSkin || !onComplete) {
      console.error('CaseRevealingPhase: Missing required props');
      return;
    }

    // Фаза анализа
    const timer1 = setTimeout(() => {
      console.log('CaseRevealingPhase: Starting roulette');
      setRevealPhase('roulette');
    }, 1000);

    // Переход к финализации
    const timer2 = setTimeout(() => {
      console.log('CaseRevealingPhase: Finalizing');
      setRevealPhase('finalizing');
      setTimeout(() => {
        console.log('CaseRevealingPhase: Completing');
        onComplete();
      }, 500);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [caseSkins, wonSkin, onComplete]);

  if (revealPhase === 'roulette' && caseSkins && wonSkin) {
    return <CaseRoulette caseSkins={caseSkins} wonSkin={wonSkin} onComplete={() => {}} />;
  }

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
        {revealPhase === 'analyzing' && 'Анализ содержимого...'}
        {revealPhase === 'finalizing' && 'Финализация выигрыша...'}
      </h2>
      
      <div className="relative flex justify-center">
        {/* Простой анализатор */}
        <div className="w-40 h-40 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-5xl shadow-2xl shadow-cyan-500/50 animate-pulse">
            💎
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-4 border-transparent border-t-cyan-400 border-r-cyan-400 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-8">
        <p className="text-cyan-300 text-xl font-semibold animate-pulse">
          {revealPhase === 'analyzing' && 'Сканирование матрицы...'}
          {revealPhase === 'finalizing' && 'Калибровка результата...'}
        </p>
      </div>
    </div>
  );
};

export default CaseRevealingPhase;
