
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Package, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: {
    id: string;
    name: string;
    rarity?: string;
    price: number;
    image_url?: string;
    type: 'skin' | 'coin_reward';
    weapon_type?: string;
    amount?: number;
  };
  newBalance: number;
  onInventoryUpdate: () => void;
}

const PurchaseSuccessModal = ({
  isOpen,
  onClose,
  reward,
  newBalance,
  onInventoryUpdate
}: PurchaseSuccessModalProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPerformedAction, setHasPerformedAction] = useState(false);

  const getRarityColor = (rarity?: string) => {
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

  const handleAddToInventory = () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    toast({
      title: "Добавлено в инвентарь!",
      description: "Предмет успешно добавлен в ваш инвентарь",
    });
    setHasPerformedAction(true);
    onInventoryUpdate();
    
    // Автоматически закрываем модальное окно через 2 секунды
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleCloseModal = () => {
    if (!isProcessing) {
      setHasPerformedAction(false);
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-center text-white">
            {reward.type === 'coin_reward' ? 'Награда получена!' : 'Поздравляем с покупкой!'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-4">
            <div className={`relative w-32 h-32 rounded-lg bg-gradient-to-br ${getRarityColor(reward.rarity)} p-1`}>
              <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                <OptimizedImage
                  src={reward.image_url}
                  alt={reward.name}
                  className="w-full h-full object-cover"
                  timeout={5000}
                  fallback={
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {reward.type === 'coin_reward' ? '🪙' : '🔫'}
                    </div>
                  }
                />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">
                {reward.type === 'coin_reward' ? `${reward.amount} монет` : reward.name}
              </h3>
              
              {reward.type === 'skin' && (
                <>
                  {reward.weapon_type && (
                    <p className="text-gray-400">{reward.weapon_type}</p>
                  )}
                  {reward.rarity && (
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {reward.rarity}
                    </Badge>
                  )}
                </>
              )}
              
              <div className="flex items-center justify-center gap-1 text-yellow-400">
                <Coins className="w-4 h-4" />
                <span className="font-bold">{reward.type === 'coin_reward' ? reward.amount : reward.price}₽</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <Coins className="w-5 h-5" />
              <span>Новый баланс: {newBalance.toLocaleString()} монет</span>
            </div>
          </div>

          <div className="space-y-3">
            {hasPerformedAction ? (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <p className="text-green-400 text-center">Операция выполнена успешно!</p>
                <p className="text-gray-400 text-sm text-center">Окно закроется автоматически...</p>
              </div>
            ) : (
              <>
                {reward.type === 'skin' && (
                  <Button
                    onClick={handleAddToInventory}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isProcessing}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Добавление...' : 'Добавить в инвентарь'}
                  </Button>
                )}

                {reward.type === 'coin_reward' && (
                  <Button
                    onClick={handleCloseModal}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isProcessing}
                  >
                    Отлично!
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseSuccessModal;
