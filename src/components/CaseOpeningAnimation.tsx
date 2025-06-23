
import { X } from "lucide-react";
import { useCaseOpening } from "@/hooks/useCaseOpening";
import { useVibration } from "@/hooks/useVibration";
import { useEffect } from "react";
import CaseOpeningPhase from "@/components/animations/CaseOpeningPhase";
import UnifiedCaseRoulette from "@/components/animations/UnifiedCaseRoulette";
import CaseCompletePhase from "@/components/animations/CaseCompletePhase";

interface CaseOpeningAnimationProps {
  caseItem: any;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const CaseOpeningAnimation = ({ caseItem, onClose, currentUser, onCoinsUpdate }: CaseOpeningAnimationProps) => {
  console.log('CaseOpeningAnimation: Rendering', { 
    caseName: caseItem?.name, 
    isFree: caseItem?.is_free 
  });

  const {
    wonSkin,
    wonCoins,
    isComplete,
    animationPhase,
    isProcessing,
    addToInventory,
    sellDirectly,
    caseSkins,
    error,
    isLoading,
    rouletteData,
    handleRouletteComplete
  } = useCaseOpening({ caseItem, currentUser, onCoinsUpdate });

  const { vibrateLight, vibrateSuccess, vibrateRare } = useVibration();

  console.log('CaseOpeningAnimation: State', { 
    animationPhase, 
    isComplete, 
    hasWonSkin: !!wonSkin,
    hasWonCoins: wonCoins > 0,
    hasRouletteData: !!rouletteData,
    error,
    isLoading
  });

  // Добавляем вибрацию на разных этапах анимации
  useEffect(() => {
    if (animationPhase === 'opening') {
      vibrateLight();
    } else if (animationPhase === 'roulette') {
      vibrateLight();
    } else if (isComplete && (wonSkin || wonCoins > 0)) {
      if (wonSkin) {
        const rarity = wonSkin.rarity?.toLowerCase();
        if (rarity === 'covert' || rarity === 'classified') {
          vibrateRare();
        } else {
          vibrateSuccess();
        }
      } else if (wonCoins > 0) {
        vibrateSuccess();
      }
    }
  }, [animationPhase, isComplete, wonSkin, wonCoins, vibrateLight, vibrateSuccess, vibrateRare]);

  const handleAddToInventory = async () => {
    console.log('Adding to inventory');
    vibrateLight();
    await addToInventory();
    onClose();
  };

  const handleSellDirectly = async () => {
    console.log('Selling directly');
    vibrateLight();
    await sellDirectly();
    onClose();
  };

  // Показываем ошибку если есть
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-slate-900 rounded-xl sm:rounded-2xl w-full max-w-md mx-auto relative border border-red-500/30 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Ошибка</h2>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Показываем загрузку
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-slate-900 rounded-xl sm:rounded-2xl w-full max-w-md mx-auto relative border border-orange-500/30 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-white mb-4">Загрузка кейса...</h2>
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-xl sm:rounded-2xl w-full max-w-6xl mx-auto relative border border-orange-500/30 max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-colors z-10 bg-black/50 rounded-full p-1.5 sm:p-2"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="p-3 sm:p-6">
          {/* Фаза открытия - показывает анимацию кейса */}
          {animationPhase === 'opening' && (
            <div className="min-h-[400px] flex items-center justify-center">
              <CaseOpeningPhase />
            </div>
          )}
          
          {/* Фаза рулетки - показывает данные от сервера */}
          {animationPhase === 'roulette' && rouletteData && (
            <UnifiedCaseRoulette 
              rouletteItems={rouletteData.items}
              winnerPosition={rouletteData.winnerPosition}
              onComplete={handleRouletteComplete}
            />
          )}

          {/* Завершение - показ скина */}
          {isComplete && wonSkin && (
            <CaseCompletePhase
              wonSkin={wonSkin}
              isProcessing={isProcessing}
              onAddToInventory={handleAddToInventory}
              onSellDirectly={handleSellDirectly}
            />
          )}

          {/* Завершение - монеты */}
          {isComplete && wonCoins > 0 && !wonSkin && (
            <div className="min-h-[500px] flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-white text-3xl font-bold mb-4">Поздравляем!</div>
                <div className="text-yellow-400 text-5xl font-bold mb-4">{wonCoins}</div>
                <div className="text-gray-400 text-lg mb-6">монет добавлено на ваш баланс</div>
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
                >
                  Отлично!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseOpeningAnimation;
