
import { X } from "lucide-react";
import { useCaseOpening } from "@/hooks/useCaseOpening";
import CaseOpeningPhase from "@/components/animations/CaseOpeningPhase";
import CaseRevealingPhase from "@/components/animations/CaseRevealingPhase";
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
  console.log('CaseOpeningAnimation: Rendering');

  const {
    wonSkin,
    isComplete,
    animationPhase,
    isProcessing,
    addToInventory,
    sellDirectly,
    caseSkins
  } = useCaseOpening({ caseItem, currentUser, onCoinsUpdate });

  console.log('CaseOpeningAnimation: State', { 
    animationPhase, 
    isComplete, 
    hasWonSkin: !!wonSkin,
    hasCaseSkins: !!caseSkins?.length 
  });

  const handleAddToInventory = async () => {
    console.log('Adding to inventory');
    await addToInventory();
    onClose();
  };

  const handleSellDirectly = async () => {
    console.log('Selling directly');
    await sellDirectly();
    onClose();
  };

  const handleRevealComplete = () => {
    console.log('Reveal phase complete');
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
          {/* Показываем текущую фазу */}
          {animationPhase === 'opening' && <CaseOpeningPhase />}
          
          {animationPhase === 'revealing' && (
            <CaseRevealingPhase 
              caseSkins={caseSkins} 
              wonSkin={wonSkin} 
              onComplete={handleRevealComplete}
            />
          )}

          {isComplete && wonSkin && (
            <CaseCompletePhase
              wonSkin={wonSkin}
              isProcessing={isProcessing}
              onAddToInventory={handleAddToInventory}
              onSellDirectly={handleSellDirectly}
            />
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
