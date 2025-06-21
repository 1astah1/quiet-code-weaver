
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, Plus, Minus } from "lucide-react";

interface UserBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    username: string;
    coins: number;
  };
  onBalanceUpdate: () => void;
}

const UserBalanceModal = ({ isOpen, onClose, user, onBalanceUpdate }: UserBalanceModalProps) => {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBalanceChange = async (operation: 'add' | 'subtract' | 'set') => {
    if (!amount || isNaN(Number(amount))) {
      toast({
        title: "Ошибка",
        description: "Введите корректную сумму",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const amountNum = parseInt(amount);
      let newBalance = user.coins;

      switch (operation) {
        case 'add':
          newBalance = user.coins + amountNum;
          break;
        case 'subtract':
          newBalance = Math.max(0, user.coins - amountNum);
          break;
        case 'set':
          newBalance = Math.max(0, amountNum);
          break;
      }

      const { error } = await supabase
        .from('users')
        .update({ coins: newBalance })
        .eq('id', user.id);

      if (error) throw error;

      onBalanceUpdate();
      onClose();
      setAmount("");

      const operationText = operation === 'add' ? 'начислено' : 
                           operation === 'subtract' ? 'списано' : 'установлено';
      
      toast({
        title: "Баланс обновлен",
        description: `Пользователю ${user.username} ${operationText} ${amountNum} монет`,
      });
    } catch (error) {
      console.error('Ошибка обновления баланса:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить баланс пользователя",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            Управление балансом
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Пользователь: <span className="font-medium">{user.username}</span>
            </p>
            <p className="text-sm text-gray-600">
              Текущий баланс: <span className="font-medium text-yellow-600">{user.coins} монет</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Количество монет</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Введите количество"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => handleBalanceChange('add')}
              disabled={isLoading || !amount}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Начислить
            </Button>
            
            <Button 
              onClick={() => handleBalanceChange('subtract')}
              disabled={isLoading || !amount}
              variant="destructive"
              className="flex-1"
            >
              <Minus className="w-4 h-4 mr-1" />
              Списать
            </Button>
          </div>

          <Button 
            onClick={() => handleBalanceChange('set')}
            disabled={isLoading || !amount}
            variant="outline"
            className="w-full"
          >
            Установить точный баланс
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserBalanceModal;
