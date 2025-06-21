
import { useState } from "react";
import { Crown, X, Check, Shield, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
    isPremium: boolean;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const PremiumModal = ({ isOpen, onClose, currentUser, onCoinsUpdate }: PremiumModalProps) => {
  const [isFreeTrial, setIsFreeTrial] = useState(true);

  if (!isOpen) return null;

  const features = [
    {
      icon: Shield,
      title: "Без рекламы",
      description: "Избежать нативной рекламы в приложении"
    },
    {
      icon: Star,
      title: "Специальные кейсы",
      description: "Доступ к редким премиум кейсам"
    },
    {
      icon: Zap,
      title: "15% бонуса наград",
      description: "Получайте на 15% больше монет"
    },
    {
      icon: Crown,
      title: "x2 жизней в викторине",
      description: "Удвоенное количество жизней"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl w-full max-w-md border-2 border-yellow-300 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <Crown className="w-12 h-12 text-white mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white mb-1">Премиум подписка</h2>
          <p className="text-yellow-100">Откройте все возможности!</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Features */}
          <div className="space-y-4 mb-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl p-4 border-2 border-yellow-200 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 mb-1">$5</div>
              <div className="text-gray-600 text-sm mb-3">в месяц</div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-2">
                3 дня бесплатно
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 rounded-xl text-lg"
            onClick={() => {}}
          >
            {isFreeTrial ? "Начать бесплатно" : "Приобрести премиум"}
          </Button>

          {/* Disclaimers */}
          <div className="mt-6 space-y-3 text-xs text-gray-500">
            <p className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              ⚠️ Подписка будет автоматически продлеваться каждый месяц. Вы можете отменить её в любое время в настройках своего аккаунта.
            </p>
            <button className="text-yellow-600 underline">
              Политика конфиденциальности
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
