
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
  const {
    wonSkin,
    isComplete,
    animationPhase,
    isProcessing,
    addToInventory,
    sellDirectly,
    caseSkins
  } = useCaseOpening({ caseItem, currentUser, onCoinsUpdate });

  const handleAddToInventory = async () => {
    await addToInventory();
    onClose();
  };

  const handleSellDirectly = async () => {
    await sellDirectly();
    onClose();
  };

  const handleRouletteComplete = () => {
    // Эта функция будет вызвана когда рулетка закончится
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-xl sm:rounded-2xl md:rounded-3xl w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto text-center relative overflow-hidden border border-orange-500/30 max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-4 md:top-6 right-2 sm:right-4 md:right-6 text-gray-400 hover:text-white transition-colors z-10 bg-black/50 rounded-full p-1.5 sm:p-2"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
        </button>

        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          {animationPhase === 'opening' && <CaseOpeningPhase />}
          
          {animationPhase === 'revealing' && (
            <CaseRevealingPhase 
              caseSkins={caseSkins} 
              wonSkin={wonSkin} 
              onComplete={handleRouletteComplete}
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
        </div>
      </div>
    </div>
  );
};

export default CaseOpeningAnimation;
