
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface CaseItem {
  id: string;
  name: string;
  rarity: string;
  image_url?: string;
  price?: number;
  amount?: number;
  type: 'skin' | 'coin_reward';
}

interface CaseOpeningAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: any;
  wonItem: CaseItem | null;
  onOpenComplete: () => void;
}

const CaseOpeningAnimation = ({ 
  isOpen, 
  onClose, 
  caseData, 
  wonItem, 
  onOpenComplete 
}: CaseOpeningAnimationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isOpen && wonItem) {
      setIsAnimating(true);
      
      // Имитируем анимацию открытия кейса
      const timer1 = setTimeout(() => {
        setIsAnimating(false);
        setShowResult(true);
      }, 3000);

      // Автоматически закрываем через 5 секунд после показа результата
      const timer2 = setTimeout(() => {
        handleClose();
      }, 8000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen, wonItem]);

  const handleClose = () => {
    setShowResult(false);
    setIsAnimating(false);
    onOpenComplete();
    onClose();
  };

  if (!isOpen) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'consumer': return '#b0c3d9';
      case 'industrial': return '#5e98d9';
      case 'mil-spec': return '#4b69ff';
      case 'restricted': return '#8847ff';
      case 'classified': return '#d32ce6';
      case 'covert': return '#eb4b4b';
      case 'contraband': return '#e4ae39';
      default: return '#666666';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {isAnimating && (
          <div className="text-center">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Открываем {caseData?.name}...
              </h2>
              <div className="w-32 h-32 mx-auto mb-4 relative">
                {caseData?.image_url && (
                  <OptimizedImage
                    src={caseData.image_url}
                    alt={caseData.name}
                    className="w-full h-full object-contain animate-pulse"
                  />
                )}
              </div>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {showResult && wonItem && (
          <Card className="p-6 bg-gray-900 border-2 animate-in zoom-in-95 duration-500" 
                style={{ borderColor: wonItem.type === 'skin' ? getRarityColor(wonItem.rarity) : '#fbbf24' }}>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                🎉 Поздравляем!
              </h2>
              
              <div className="w-32 h-32 mx-auto mb-4 relative">
                {wonItem.image_url && (
                  <OptimizedImage
                    src={wonItem.image_url}
                    alt={wonItem.name}
                    className="w-full h-full object-contain"
                    fallback={
                      <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">
                          {wonItem.type === 'coin_reward' ? '🪙' : '🔫'}
                        </span>
                      </div>
                    }
                  />
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {wonItem.name}
              </h3>

              {wonItem.type === 'skin' ? (
                <div>
                  <p className="text-sm text-gray-400 mb-2">{wonItem.rarity}</p>
                  <p className="text-lg font-bold text-yellow-400">
                    {wonItem.price?.toLocaleString()} монет
                  </p>
                </div>
              ) : (
                <p className="text-lg font-bold text-yellow-400">
                  +{wonItem.amount} монет
                </p>
              )}

              <button
                onClick={handleClose}
                className="mt-6 w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Отлично!
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CaseOpeningAnimation;
