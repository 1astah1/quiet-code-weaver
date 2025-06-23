
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  inventoryId?: string;
  onInventoryUpdate: () => void;
}

const PurchaseSuccessModal = ({
  isOpen,
  onClose,
  reward,
  newBalance,
  inventoryId,
  onInventoryUpdate
}: PurchaseSuccessModalProps) => {
  const { toast } = useToast();
  const [isSellingMode, setIsSellingMode] = useState(false);
  const [isSelling, setIsSelling] = useState(false);

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

  const handleSellItem = async () => {
    if (!inventoryId || reward.type !== 'skin') return;
    
    setIsSelling(true);
    try {
      const sellPrice = Math.floor(reward.price * 0.8);
      
      const { data, error } = await supabase.rpc('safe_sell_case_reward', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_skin_id: reward.id,
        p_sell_price: sellPrice
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Скин продан!",
          description: `Получено ${sellPrice} монет`,
        });
        onInventoryUpdate();
        onClose();
      } else {
        throw new Error(data?.error || 'Ошибка продажи');
      }
    } catch (error) {
      console.error('Ошибка продажи:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось продать предмет",
        variant: "destructive",
      });
    } finally {
      setIsSelling(false);
    }
  };

  const handleAddToInventory = () => {
    toast({
      title: "Добавлено в инвентарь!",
      description: "Предмет успешно добавлен в ваш инвентарь",
    });
    onInventoryUpdate();
    onClose();
  };

  const handleCloseModal = () => {
    setIsSellingMode(false);
    setIsSelling(false);
    onClose();
  };

  const sellPrice = reward.type === 'skin' ? Math.floor(reward.price * 0.8) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-center text-white">
            {reward.type === 'coin_reward' ? 'Награда получена!' : 'Поздравляем с выигрышем!'}
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
            {reward.type === 'skin' && !isSellingMode && (
              <>
                <Button
                  onClick={handleAddToInventory}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSelling}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Добавить в инвентарь
                </Button>
                
                <Button
                  onClick={() => setIsSellingMode(true)}
                  variant="outline"
                  className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  disabled={isSelling}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Продать за {sellPrice} монет
                </Button>
              </>
            )}

            {reward.type === 'skin' && isSellingMode && (
              <div className="space-y-3">
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <p className="text-orange-300 text-sm text-center">
                    Вы уверены, что хотите продать этот предмет за {sellPrice} монет?
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSellItem}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={isSelling}
                  >
                    {isSelling ? 'Продаем...' : 'Да, продать'}
                  </Button>
                  
                  <Button
                    onClick={() => setIsSellingMode(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={isSelling}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}

            {reward.type === 'coin_reward' && (
              <Button
                onClick={handleCloseModal}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Отлично!
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseSuccessModal;
