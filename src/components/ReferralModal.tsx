import { useState } from "react";
import { X, Copy, Users, Gift, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  // Получаем статистику рефералов
  const { data: referralStats } = useQuery({
    queryKey: ['referral-stats', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('referrer_id', currentUser.id);
        
      if (error) throw error;
      
      const totalEarnings = data?.reduce((sum, earning) => sum + earning.coins_earned, 0) || 0;
      const totalReferrals = data?.length || 0;
      
      return { totalEarnings, totalReferrals };
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  const referralCode = currentUser.referralCode;
  const referralLink = referralCode ? `${window.location.origin}/ref/${referralCode}` : '';

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано!",
        description: `${type} скопирован в буфер обмена`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать",
        variant: "destructive",
      });
    }
  };

  const shareReferralLink = async () => {
    if (!referralLink) return;
    
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'FastMarket - Открывай кейсы CS2!',
          text: 'Присоединяйся к FastMarket и получи бонус за регистрацию!',
          url: referralLink,
        });
      } else {
        await copyToClipboard(referralLink, 'Реферальная ссылка');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share failed:', error);
        await copyToClipboard(referralLink, 'Реферальная ссылка');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-md border border-orange-500/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Реферальная программа</h2>
              <p className="text-gray-400 text-sm">Приглашай друзей и получай бонусы</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {referralStats?.totalReferrals || 0}
              </div>
              <div className="text-gray-400 text-sm">Рефералов</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {referralStats?.totalEarnings || 0}
              </div>
              <div className="text-gray-400 text-sm">Монет заработано</div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-white mb-3 flex items-center">
              <Gift className="w-5 h-5 mr-2 text-purple-400" />
              Как это работает
            </h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center">
                <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs mr-3">1</span>
                Поделись своей ссылкой с друзьями
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs mr-3">2</span>
                Друг регистрируется по твоей ссылке
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs mr-3">3</span>
                Вы оба получаете 50 монет!
              </div>
            </div>
          </div>

          {/* Referral Code & Link */}
          {referralCode ? (
            <div className="space-y-4">
              {/* Referral Code */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Ваш реферальный код
                </label>
                <div className="flex">
                  <div className="flex-1 bg-gray-800 rounded-l-lg px-4 py-3 text-white font-mono text-lg">
                    {referralCode}
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralCode, 'Реферальный код')}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-r-lg transition-colors"
                  >
                    <Copy className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Referral Link */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Реферальная ссылка
                </label>
                <div className="flex">
                  <div className="flex-1 bg-gray-800 rounded-l-lg px-4 py-3 text-white text-sm truncate">
                    {referralLink}
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralLink, 'Реферальная ссылка')}
                    className="bg-orange-600 hover:bg-orange-700 px-4 py-3 transition-colors"
                  >
                    <Copy className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={shareReferralLink}
                    disabled={isSharing}
                    className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-r-lg transition-colors disabled:opacity-50"
                  >
                    <Share2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Share Message */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Сообщение для друзей:</h4>
                <p className="text-gray-300 text-sm italic">
                  "Привет! Присоединяйся к FastMarket - крутой сайт для открытия кейсов CS2! 
                  Регистрируйся по моей ссылке и получи бонус 🎁: {referralLink}"
                </p>
                <button
                  onClick={() => copyToClipboard(`Привет! Присоединяйся к FastMarket - крутой сайт для открытия кейсов CS2! Регистрируйся по моей ссылке и получи бонус 🎁: ${referralLink}`, 'Сообщение')}
                  className="mt-2 text-purple-400 hover:text-purple-300 text-sm flex items-center"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Скопировать сообщение
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🔄</div>
              <p className="text-gray-400">Загрузка реферального кода...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;
