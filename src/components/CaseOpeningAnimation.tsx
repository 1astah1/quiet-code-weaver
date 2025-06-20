
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
    sellDirectly
  } = useCaseOpening({ caseItem, currentUser, onCoinsUpdate });

  const handleAddToInventory = async () => {
    await addToInventory();
    onClose();
  };

  const handleSellDirectly = async () => {
    await sellDirectly();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-3xl p-8 w-full max-w-4xl mx-4 text-center relative overflow-hidden border border-orange-500/30">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-8 h-8" />
        </button>

        {animationPhase === 'opening' && <CaseOpeningPhase />}
        
        {animationPhase === 'revealing' && <CaseRevealingPhase />}

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
  );
};

export default CaseOpeningAnimation;
