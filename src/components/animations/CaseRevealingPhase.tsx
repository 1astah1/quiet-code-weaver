
import { useState, useEffect } from "react";
import CaseRoulette from "./CaseRoulette";

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
    return <CaseRoulette caseSkins={caseSkins} wonSkin={wonSkin} onComplete={onComplete} />;
  }

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-900">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        Определяем выигрыш...
      </h2>
      
      <div className="relative">
        <div className="w-40 h-40 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-5xl shadow-2xl">
          💎
        </div>
        
        <div className="absolute inset-0 border-4 border-purple-400 rounded-2xl animate-pulse"></div>
      </div>
      
      <p className="text-purple-400 text-xl font-semibold mt-8 animate-pulse">
        Анализ содержимого...
      </p>
    </div>
  );
};

export default CaseRevealingPhase;
