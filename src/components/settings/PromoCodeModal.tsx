import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Gift } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/components/ui/use-translation";

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
    language_code?: string;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const PromoCodeModal = ({ isOpen, onClose, currentUser, onCoinsUpdate }: PromoCodeModalProps) => {
  const [promoCode, setPromoCode] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation(currentUser.language_code);

  const usePromoCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      // Проверяем промокод
      const { data: promoData, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (promoError || !promoData) {
        throw new Error(t('promoCodeNotFound') || 'Промокод не найден или неактивен');
      }

      // Проверяем, не использовал ли пользователь уже этот промокод
      const { data: usedPromo } = await supabase
        .from('user_promo_codes')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('promo_code_id', promoData.id)
        .maybeSingle();

      if (usedPromo) {
        throw new Error(t('promoCodeAlreadyUsed') || 'Промокод уже был использован');
      }

      // Проверяем лимит использований
      if (promoData.max_uses && promoData.current_uses >= promoData.max_uses) {
        throw new Error(t('promoCodeLimitExceeded') || 'Превышен лимит использований промокода');
      }

      // Проверяем срок действия
      if (promoData.expires_at && new Date(promoData.expires_at) < new Date()) {
        throw new Error(t('promoCodeExpired') || 'Срок действия промокода истек');
      }

      // Начисляем монеты
      const newCoins = currentUser.coins + promoData.reward_coins;
      const { error: coinsError } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);

      if (coinsError) throw coinsError;

      // Отмечаем промокод как использованный
      const { error: useError } = await supabase
        .from('user_promo_codes')
        .insert({
          user_id: currentUser.id,
          promo_code_id: promoData.id
        });

      if (useError) throw useError;

      // Обновляем счетчик использований
      const { error: updateError } = await supabase
        .from('promo_codes')
        .update({ current_uses: promoData.current_uses + 1 })
        .eq('id', promoData.id);

      if (updateError) throw updateError;

      return { newCoins, reward: promoData.reward_coins };
    },
    onSuccess: (data) => {
      onCoinsUpdate(data.newCoins);
      toast({
        title: t('promoCodeActivated') || "Промокод активирован!",
        description: t('coinsReceived')?.replace('{amount}', data.reward.toString()) || `Получено ${data.reward} монет`,
      });
      setPromoCode("");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: t('error') || "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim()) {
      usePromoCodeMutation.mutate(promoCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-md border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">{t('promoCodes') || 'Промокоды'}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-slate-300 mb-6">
            {t('enterPromoCodeDesc') || 'Введите промокод для получения бонусных монет'}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder={t('enterPromoCode') || 'Введите промокод'}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            
            <button
              type="submit"
              disabled={!promoCode.trim() || usePromoCodeMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition-all hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
            >
              {usePromoCodeMutation.isPending ? (t('activating') || "Активация...") : (t('activatePromoCode') || "Активировать")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeModal;
