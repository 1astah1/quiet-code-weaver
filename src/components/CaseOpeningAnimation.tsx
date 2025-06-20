
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
  console.log('CaseOpeningAnimation: Rendering with props', { 
    caseItem: caseItem?.name, 
    currentUser: currentUser?.username 
  });

  const {
    wonSkin,
    isComplete,
    animationPhase,
    isProcessing,
    addToInventory,
    sellDirectly,
    caseSkins
  } = useCaseOpening({ caseItem, currentUser, onCoinsUpdate });

  console.log('CaseOpeningAnimation: Hook state', { 
    animationPhase, 
    isComplete, 
    wonSkin: !!wonSkin,
    caseSkins: caseSkins?.length 
  });

  const handleAddToInventory = async () => {
    console.log('CaseOpeningAnimation: Adding to inventory');
    await addToInventory();
    onClose();
  };

  const handleSellDirectly = async () => {
    console.log('CaseOpeningAnimation: Selling directly');
    await sellDirectly();
    onClose();
  };

  const handleRouletteComplete = () => {
    console.log('CaseOpeningAnimation: Roulette complete');
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl w-full max-w-4xl mx-auto text-center relative overflow-hidden border border-orange-500/30 max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 bg-black/50 rounded-full p-2"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          {animationPhase === 'opening' && (
            <CaseOpeningPhase />
          )}
          
          {animationPhase === 'revealing' && caseSkins && wonSkin && (
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
