
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Sparkles, ArrowRight } from "lucide-react";

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchasedItem: {
    name: string;
    weapon_type: string;
    rarity: string;
    price: number;
    image_url?: string;
  } | null;
  onViewInventory: () => void;
}

const PurchaseSuccessModal = ({ 
  isOpen, 
  onClose, 
  purchasedItem, 
  onViewInventory 
}: PurchaseSuccessModalProps) => {
  const [isClosing, setIsClosing] = useState(false);

  const getRarityColor = (rarity: string) => {
    const colors = {
      'Covert': 'from-orange-500 to-red-500',
      'Classified': 'from-red-500 to-pink-500', 
      'Restricted': 'from-purple-500 to-pink-500',
      'Mil-Spec': 'from-blue-500 to-purple-500',
      'Industrial Grade': 'from-blue-400 to-blue-600',
      'Consumer Grade': 'from-gray-500 to-gray-600',
    };
    return colors[rarity as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleViewInventory = () => {
    handleClose();
    setTimeout(() => {
      onViewInventory();
    }, 400);
  };

  if (!purchasedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader className="text-center space-y-4">
          {/* Success Animation */}
          <div className="relative mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/50">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Покупка успешна!
          </DialogTitle>
        </DialogHeader>

        {/* Purchased Item Display */}
        <div className={`relative bg-gradient-to-br ${getRarityColor(purchasedItem.rarity)} rounded-xl p-6 mx-4 my-6 overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/30 rounded-full"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/20 rounded-full"></div>
          </div>

          {/* Rarity Badge */}
          <div className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded text-xs text-white font-medium">
            {purchasedItem.rarity}
          </div>

          {/* Item Image */}
          <div className="relative bg-black/30 rounded-lg h-24 mb-4 flex items-center justify-center">
            {purchasedItem.image_url ? (
              <img 
                src={purchasedItem.image_url} 
                alt={purchasedItem.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="w-8 h-8 text-white/70" />
            )}
          </div>

          {/* Item Info */}
          <div className="relative z-10 text-center">
            <h3 className="text-white font-bold text-lg mb-1">{purchasedItem.name}</h3>
            <p className="text-white/90 text-sm mb-2">{purchasedItem.weapon_type}</p>
            <div className="flex items-center justify-center gap-1 text-yellow-300">
              <span className="text-sm font-medium">{purchasedItem.price} монет</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 px-4 pb-4">
          <Button
            onClick={handleViewInventory}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
          >
            <Package className="w-4 h-4" />
            Перейти в инвентарь
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300"
          >
            Продолжить покупки
          </Button>
        </div>

        {/* Celebration Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-12 left-6 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-8 right-4 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseSuccessModal;
