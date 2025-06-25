import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Info, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/components/ui/use-translation";

interface WithdrawSkinModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItemId: string;
  skinName: string;
  skinImage?: string;
  currentTradeUrl?: string;
  currentUser: any;
}

const WithdrawSkinModal = ({ 
  isOpen, 
  onClose, 
  inventoryItemId, 
  skinName, 
  skinImage,
  currentTradeUrl,
  currentUser
}: WithdrawSkinModalProps) => {
  const [steamTradeUrl, setSteamTradeUrl] = useState(currentTradeUrl || '');
  const withdrawMutation = useWithdrawSkin();

  const handleWithdraw = async () => {
    if (!steamTradeUrl) {
      return;
    }

    try {
      await withdrawMutation.mutateAsync({
        inventoryItemId,
        steamTradeUrl
      });
      onClose();
    } catch (error) {
      // Ошибка обрабатывается в хуке
    }
  };

  const validateTradeUrl = (url: string) => {
    return url.includes('steamcommunity.com') && url.includes('tradeoffer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Вывод скина</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Информация о скине */}
          <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
            {skinImage && (
              <img 
                src={skinImage} 
                alt={skinName}
                className="w-12 h-12 object-contain rounded"
              />
            )}
            <div>
              <p className="text-white font-medium">{skinName}</p>
              <p className="text-slate-400 text-sm">Будет отправлен в Steam</p>
            </div>
          </div>

          {/* Инструкция */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Как получить Trade URL:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Откройте Steam в браузере</li>
                  <li>Перейдите в Инвентарь → Настройки приватности</li>
                  <li>Скопируйте Trade URL</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Поле ввода Trade URL */}
          <div className="space-y-2">
            <Label htmlFor="tradeUrl" className="text-white">
              Steam Trade URL
            </Label>
            <Input
              id="tradeUrl"
              type="url"
              placeholder="https://steamcommunity.com/tradeoffer/new/..."
              value={steamTradeUrl}
              onChange={(e) => setSteamTradeUrl(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
            {steamTradeUrl && !validateTradeUrl(steamTradeUrl) && (
              <p className="text-red-400 text-xs">
                Неверный формат Trade URL
              </p>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex space-x-2">
            <Button
              onClick={handleWithdraw}
              disabled={!steamTradeUrl || !validateTradeUrl(steamTradeUrl) || withdrawMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {withdrawMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Создание трейда...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Вывести скин
                </>
              )}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Отмена
            </Button>
          </div>

          {/* Ссылка на настройки Steam */}
          <div className="text-center">
            <a
              href="https://steamcommunity.com/my/tradeoffers/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Открыть настройки Steam
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawSkinModal;
