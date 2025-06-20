
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
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl sm:rounded-3xl w-full max-w-sm sm:max-w-2xl md:max-w-4xl mx-auto text-center relative overflow-hidden border border-orange-500/30 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 text-gray-400 hover:text-white transition-colors z-10 bg-black/50 rounded-full p-2"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
        </button>

        <div className="p-4 sm:p-6 md:p-8">
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
