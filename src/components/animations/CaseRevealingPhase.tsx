
import CaseRoulette from "./CaseRoulette";

interface CaseRevealingPhaseProps {
  caseSkins?: any[];
  wonSkin?: any;
  onComplete?: () => void;
}

const CaseRevealingPhase = ({ caseSkins, wonSkin, onComplete }: CaseRevealingPhaseProps) => {
  if (caseSkins && wonSkin && onComplete) {
    return <CaseRoulette caseSkins={caseSkins} wonSkin={wonSkin} onComplete={onComplete} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 text-center">Определяем выигрыш...</h2>
      
      <div className="relative flex justify-center">
        <div className="w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48">
          <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl md:text-6xl shadow-2xl shadow-orange-500/50 animate-ping">
            ✨
          </div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 sm:w-48 md:w-56 h-40 sm:h-48 md:h-56 border-4 border-transparent border-t-yellow-400 border-r-yellow-400 rounded-full animate-spin"></div>
        </div>
      </div>
      
      <p className="text-yellow-300 text-lg sm:text-xl md:text-2xl font-semibold animate-pulse text-center">Почти готово!</p>
    </div>
  );
};

export default CaseRevealingPhase;
