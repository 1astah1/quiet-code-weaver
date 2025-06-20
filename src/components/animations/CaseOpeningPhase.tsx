
import { Sparkles } from "lucide-react";

const CaseOpeningPhase = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold text-white mb-6">Открытие кейса...</h2>
      
      <div className="relative">
        <div className="animate-bounce w-32 h-32 mx-auto mb-8">
          <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-6xl shadow-2xl shadow-orange-500/50">
            📦
          </div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 border-4 border-transparent border-t-orange-500 border-r-orange-500 rounded-full animate-spin"></div>
        </div>
      </div>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`
            }}
          >
            <Sparkles className="w-4 h-4 text-orange-400/40" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseOpeningPhase;
