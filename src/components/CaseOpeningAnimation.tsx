
import { X } from "lucide-react";
import { useCaseOpening } from "@/hooks/useCaseOpening";
import { useVibration } from "@/hooks/useVibration";
import { useEffect } from "react";
import CaseOpeningPhase from "@/components/animations/CaseOpeningPhase";
import CaseCompletePhase from "@/components/animations/CaseCompletePhase";
import CaseRoulette from "@/components/animations/CaseRoulette";

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
  console.log('CaseOpeningAnimation: Rendering for case:', caseItem?.name);

  const {
    wonSkin,
    wonCoins,
    isComplete,
    animationPhase,
    isProcessing,
    caseSkins,
    selectRandomReward,
    handleRouletteComplete,
    addToInventory,
    sellDirectly
  } = useCaseOpening({ caseItem, currentUser, onCoinsUpdate });

  const { vibrateLight, vibrateSuccess, vibrateRare } = useVibration();

  console.log('CaseOpeningAnimation: State', { 
    animationPhase, 
    isComplete, 
    hasWonSkin: !!wonSkin,
    hasWonCoins: wonCoins > 0,
    hasCaseSkins: !!caseSkins?.length
  });

  // Вибрация при завершении
  useEffect(() => {
    if (isComplete && (wonSkin || wonCoins > 0)) {
      if (wonSkin) {
        const rarity = wonSkin.rarity?.toLowerCase();
        if (rarity === 'legendary' || rarity === 'mythical' || rarity === 'immortal') {
          vibrateRare();
        } else {
          vibrateSuccess();
        }
      } else if (wonCoins > 0) {
        vibrateSuccess();
      }
    }
  }, [isComplete, wonSkin, wonCoins, vibrateSuccess, vibrateRare]);

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

  const handleCloseComplete = () => {
    if (wonCoins > 0 && !wonSkin) {
      onClose();
    }
  };

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
          {/* Фаза загрузки */}
          {animationPhase === 'loading' && <CaseOpeningPhase />}
          
          {/* Фаза рулетки */}
          {animationPhase === 'roulette' && caseSkins.length > 0 && (
            <CaseRoulette 
              caseSkins={caseSkins} 
              onComplete={handleRouletteComplete}
              selectRandomReward={selectRandomReward}
            />
          )}

          {/* Фаза завершения для скинов */}
          {isComplete && wonSkin && (
            <CaseCompletePhase
              wonSkin={wonSkin}
              isProcessing={isProcessing}
              onAddToInventory={handleAddToInventory}
              onSellDirectly={handleSellDirectly}
            />
          )}

          {/* Фаза завершения для монет */}
          {isComplete && wonCoins > 0 && !wonSkin && (
            <div className="min-h-[500px] flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-white text-3xl font-bold mb-4">Поздравляем!</div>
                <div className="text-yellow-400 text-5xl font-bold mb-4">{wonCoins}</div>
                <div className="text-gray-400 text-lg mb-6">монет добавлено на ваш баланс</div>
                <button
                  onClick={handleCloseComplete}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
                >
                  Отлично!
                </button>
              </div>
            </div>
          )}

          {/* Резервный контент если что-то пошло не так */}
          {!animationPhase && !isComplete && (
            <div className="min-h-[400px] flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="text-white text-xl mb-4">Загрузка...</div>
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseOpeningAnimation;
