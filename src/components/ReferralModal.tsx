import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Users, Copy, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
    referralCode?: string | null;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const ReferralModal = ({ isOpen, onClose, currentUser, onCoinsUpdate }: ReferralModalProps) => {
  const [referralCode, setReferralCode] = useState<string | null>(currentUser.referralCode || null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const { data: referralStats } = useQuery({
    queryKey: ['referral-stats', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('referrer_id', currentUser.id);
      
      if (error) throw error;
      
      const totalEarnings = data.reduce((sum, earning) => sum + earning.coins_earned, 0);
      const friendsCount = new Set(data.map(earning => earning.referred_id)).size;
      
      return {
        totalEarnings,
        friendsCount,
        bonusPercentage: totalEarnings >= 30000 ? 6 : 5
      };
    },
    enabled: isOpen
  });

  const generateReferralCode = useMutation({
    mutationFn: async () => {
      const code = `FM${currentUser.username.toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { error } = await supabase
        .from('users')
        .update({ referral_code: code })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      setReferralCode(code);
      toast({
        title: "Реферальный код создан!",
        description: `Ваш код: ${code}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать реферальный код",
        variant: "destructive",
      });
    }
  });

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(`https://fastmarket.app/ref/${referralCode}`);
      toast({
        title: "Скопировано!",
        description: "Реферальная ссылка скопирована в буфер обмена",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-md border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Пригласи друзей</h3>
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
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">БОЛЬШЕ ДРУЗЕЙ = БОЛЬШЕ МОНЕТ</h2>
            <p className="text-slate-300 mb-4">
              Зарабатывайте монеты, приглашая друзей в FastMarket
            </p>
            
            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg p-4 mb-4">
              <p className="text-white font-semibold mb-2">КОГДА ДРУГ СОЗДАЕТ АККАУНТ, ВЫ ОБА ПОЛУЧАЕТЕ 50 КАЖДЫЙ</p>
              <p className="text-slate-300 text-sm">
                ВЫ БУДЕТЕ ПОЛУЧАТЬ {referralStats?.bonusPercentage || 5}% ЗА КАЖДОЕ ЗАДАНИЕ, ВЫПОЛНЕННОЕ ВАШИМ ДРУГОМ
              </p>
            </div>
          </div>

          {/* Referral Code Section */}
          <div className="mb-6">
            <h4 className="text-white font-semibold mb-3">Твой реферальный код</h4>
            {referralCode ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-800 rounded-lg p-3 border border-slate-600">
                  <p className="text-white font-mono">{referralCode}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    https://fastmarket.app/ref/{referralCode}
                  </p>
                </div>
                <button
                  onClick={copyReferralCode}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg transition-all"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => generateReferralCode.mutate()}
                disabled={generateReferralCode.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-lg font-semibold transition-all"
              >
                {generateReferralCode.isPending ? "Генерация..." : "Сгенерировать"}
              </button>
            )}
          </div>

          {/* Stats Section */}
          <div className="mb-6">
            <h4 className="text-white font-semibold mb-3">ДОХОДНЫЕ ДРУЗЬЯ</h4>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300">ВАШ БОНУС</span>
                <span className="text-green-400 font-bold">{referralStats?.bonusPercentage || 5}%</span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">НА СЛЕДУЮЩИЙ БОНУСНЫЙ УРОВЕНЬ</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((referralStats?.totalEarnings || 0) / 30000 * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  {referralStats?.totalEarnings || 0} / 30K
                </p>
              </div>
              
              <p className="text-slate-300 text-sm">
                КОГДА ДРУЗЬЯ ЗАРАБОТАЮТ 30K ВАШ БОНУС УВЕЛИЧИТСЯ ДО 6%
              </p>
            </div>
          </div>

          {/* Details Button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-orange-400 hover:text-orange-300 text-sm font-medium mb-4"
          >
            {showDetails ? "скрыть условия" : "подробные условия"}
          </button>

          {/* Detailed Conditions */}
          {showDetails && (
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 text-sm text-slate-300">
              <h5 className="text-white font-semibold mb-3">Подробные условия</h5>
              <ol className="space-y-2 list-decimal list-inside">
                <li>ВАШ ДРУГ ДОЛЖЕН УСТАНОВИТЬ FASTMARKET ВПЕРВЫЕ.</li>
                <li>Установку нужно запустить, нажав на вашу реферальную ссылку.</li>
                <li>Ваш друг не должен использовать тот же IP-адрес, что и вы.</li>
              </ol>
              <p className="mt-3 text-xs text-slate-400">
                Иначе вознаграждения не смогут быть зачислены на ваши счета!
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Профили в социальных сетях, использующие "FM" в названии или наш талисман в качестве 
                аватара, должны чётко указать, что они неофициальные и не связаны с создателями FM.
              </p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-all"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;