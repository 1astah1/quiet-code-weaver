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
      console.log('🚀 [CS2_CASE_OPENING] Starting CS2-style case opening');
      setHasStarted(true);
      openCaseSafely();
    }
  }, [hasStarted, isLoading, caseItem, currentUser, openCaseSafely]);

  const handleClose = () => {
    console.log('🔐 [CS2_CASE_OPENING] Closing case animation');
    onClose();
  };

  // Обработка ошибок
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h3 className="text-white text-lg font-bold mb-2">Ошибка открытия кейса</h3>
          <p className="text-slate-300 mb-4">{error}</p>
          <Button onClick={handleClose} variant="outline">
            Закрыть
          </Button>
        </div>
      </div>
    );
  }

  // Загрузка
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg">Загрузка кейса...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
      {/* Кнопка закрытия - только если не в процессе открытия */}
      {!isProcessing && animationPhase !== 'complete' && (
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
        {/* Этап 1: Анимация открытия кейса (CS2 стиль) */}
        {animationPhase === 'opening' && (
          <div className="w-full max-w-4xl">
            <Case3DOpening />
          </div>
        )}

        {/* Этап 2: Рулетка (если есть данные) */}
        {animationPhase === 'roulette' && rouletteData && (
          <div className="w-full max-w-6xl">
            <UnifiedCaseRoulette
              rouletteItems={rouletteData.items}
              winnerPosition={rouletteData.winnerPosition}
              onComplete={handleRouletteComplete}
            />
          </div>
        )}

        {/* Этап 3: Результат с действиями */}
        {animationPhase === 'complete' && (wonSkin || wonCoins > 0) && (
          <div className="w-full max-w-4xl">
            <CaseCompletePhase
              wonSkin={wonSkin}
              isProcessing={isProcessing}
              onAddToInventory={addToInventory}
              onSellDirectly={sellDirectly}
            />
          </div>
        )}

        {/* Состояние ожидания */}
        {!animationPhase && !error && (
          <div className="text-center">
            <div className="text-white text-xl mb-4">Подготовка к открытию кейса...</div>
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </div>

      {/* Индикатор процесса */}
      {isProcessing && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 bg-slate-800/80 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-sm">Обработка...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseOpeningAnimationSafe;
