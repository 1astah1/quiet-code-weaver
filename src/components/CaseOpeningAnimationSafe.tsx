
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCaseOpeningSafe } from "@/hooks/useCaseOpeningSafe";
import Case3DOpening from "@/components/animations/Case3DOpening";
import UnifiedCaseRoulette from "@/components/animations/UnifiedCaseRoulette";
import CaseCompletePhase from "@/components/animations/CaseCompletePhase";

interface CaseOpeningAnimationSafeProps {
  caseItem: any;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const CaseOpeningAnimationSafe = ({
  caseItem,
  onClose,
  currentUser,
  onCoinsUpdate
}: CaseOpeningAnimationSafeProps) => {
  const [hasStarted, setHasStarted] = useState(false);
  
  const {
    wonSkin,
    wonCoins,
    isComplete,
    animationPhase,
    isProcessing,
    addToInventory,
    sellDirectly,
    error,
    isLoading,
    rouletteData,
    handleRouletteComplete,
    openCaseSafely
  } = useCaseOpeningSafe({ caseItem, currentUser, onCoinsUpdate });

  // Автоматически запускаем открытие кейса при монтировании
  useEffect(() => {
    if (!hasStarted && !isLoading && caseItem && currentUser) {
      console.log('🚀 [SAFE_ANIMATION] Auto-starting case opening');
      setHasStarted(true);
      openCaseSafely();
    }
  }, [hasStarted, isLoading, caseItem, currentUser, openCaseSafely]);

  const handleClose = () => {
    console.log('🔐 [SAFE_ANIMATION] Closing case animation');
    onClose();
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h3 className="text-white text-lg font-bold mb-2">Ошибка</h3>
          <p className="text-slate-300 mb-4">{error}</p>
          <Button onClick={handleClose} variant="outline">
            Закрыть
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-white text-lg">Загрузка кейса...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
      {/* Кнопка закрытия - только если не в процессе открытия */}
      {!isProcessing && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        {animationPhase === 'opening' && (
          <div className="text-center">
            <Case3DOpening />
            <div className="text-white text-xl mt-6">Открываем кейс...</div>
            <div className="text-slate-400 text-sm mt-2">
              {isProcessing ? 'Обработка...' : 'Подготовка...'}
            </div>
          </div>
        )}

        {animationPhase === 'roulette' && rouletteData && (
          <UnifiedCaseRoulette
            rouletteItems={rouletteData.items}
            winnerPosition={rouletteData.winnerPosition}
            onComplete={handleRouletteComplete}
          />
        )}

        {animationPhase === 'complete' && (wonSkin || wonCoins > 0) && (
          <CaseCompletePhase
            wonSkin={wonSkin}
            isProcessing={isProcessing}
            onAddToInventory={addToInventory}
            onSellDirectly={sellDirectly}
          />
        )}

        {!animationPhase && !error && (
          <div className="text-center">
            <div className="text-white text-xl mb-4">Подготовка к открытию...</div>
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseOpeningAnimationSafe;
