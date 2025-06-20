
import { useState } from "react";
import { Crown, Link, HelpCircle, Gift, Settings, User } from "lucide-react";
import PromoCodeModal from "./PromoCodeModal";
import FAQModal from "./FAQModal";
import SteamConnectionModal from "./SteamConnectionModal";

interface SettingsScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const SettingsScreen = ({ currentUser, onCoinsUpdate }: SettingsScreenProps) => {
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showSteamModal, setShowSteamModal] = useState(false);

  const settingsItems = [
    {
      icon: Crown,
      title: "Премиум подписка",
      description: "Получите дополнительные привилегии",
      action: () => console.log("Open premium"),
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Link,
      title: "Подключить Steam",
      description: "Свяжите аккаунт для вывода скинов",
      action: () => setShowSteamModal(true),
      color: "from-blue-500 to-purple-500"
    },
    {
      icon: HelpCircle,
      title: "Поддержка",
      description: "Часто задаваемые вопросы",
      action: () => setShowFAQModal(true),
      color: "from-green-500 to-teal-500"
    },
    {
      icon: Gift,
      title: "Промокоды",
      description: "Активируйте промокод для получения бонусов",
      action: () => setShowPromoModal(true),
      color: "from-pink-500 to-red-500"
    },
    {
      icon: Settings,
      title: "Настройки",
      description: "Общие настройки приложения",
      action: () => console.log("Open settings"),
      color: "from-gray-500 to-gray-600"
    },
    {
      icon: User,
      title: "Профиль",
      description: "Управление профилем пользователя",
      action: () => console.log("Open profile"),
      color: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Настройки</h1>
        <p className="text-slate-400">Управление аккаунтом и настройками</p>
      </div>

      <div className="space-y-4">
        {settingsItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              onClick={item.action}
              className={`bg-gradient-to-r ${item.color}/10 border border-slate-700/50 hover:border-slate-600/50 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] group`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <PromoCodeModal 
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        currentUser={currentUser}
        onCoinsUpdate={onCoinsUpdate}
      />
      
      <FAQModal 
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
      />
      
      <SteamConnectionModal 
        isOpen={showSteamModal}
        onClose={() => setShowSteamModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default SettingsScreen;
