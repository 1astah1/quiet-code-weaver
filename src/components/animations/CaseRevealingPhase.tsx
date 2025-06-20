
import { useState, useEffect } from "react";
import NewCaseRoulette from "./NewCaseRoulette";

interface CaseRevealingPhaseProps {
  caseSkins?: any[];
  wonSkin?: any;
  onComplete?: () => void;
}

const CaseRevealingPhase = ({ caseSkins, wonSkin, onComplete }: CaseRevealingPhaseProps) => {
  const [showRoulette, setShowRoulette] = useState(false);

  useEffect(() => {
    console.log('CaseRevealingPhase: Starting reveal');
    
    if (!caseSkins || !wonSkin || !onComplete) {
      console.error('CaseRevealingPhase: Missing props');
      return;
    }

    const timer = setTimeout(() => {
      console.log('CaseRevealingPhase: Showing roulette');
      setShowRoulette(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [caseSkins, wonSkin, onComplete]);

  if (showRoulette && caseSkins && wonSkin) {
    return <NewCaseRoulette caseSkins={caseSkins} wonSkin={wonSkin} onComplete={onComplete} />;
  }

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 to-black">
      <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text mb-8 text-center">
        Подготовка рулетки...
      </h2>
      
      <div className="relative mb-8">
        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-3xl flex items-center justify-center text-6xl sm:text-7xl shadow-2xl animate-pulse">
          🎰
        </div>
        
        <div className="absolute inset-0 border-4 border-purple-400 rounded-3xl animate-ping opacity-75"></div>
        <div className="absolute inset-0 border-4 border-blue-400 rounded-3xl animate-ping opacity-50 delay-150"></div>
      </div>
      
      <p className="text-purple-400 text-xl sm:text-2xl font-semibold animate-pulse text-center">
        Загружаем магию...
      </p>
    </div>
  );
};

export default CaseRevealingPhase;
