
import { useState } from "react";
import CasesTab from "@/components/skins/CasesTab";
import ShopTab from "@/components/skins/ShopTab";
import InventoryScreen from "@/components/inventory/InventoryScreen";
import { createTestUser } from "@/utils/uuid";

interface SkinsScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const SkinsScreen = ({ currentUser, onCoinsUpdate }: SkinsScreenProps) => {
  const [activeTab, setActiveTab] = useState<"cases" | "shop" | "inventory">("cases");

  // Создаем пользователя с правильным UUID если нужно
  const validUser = currentUser.id.includes('test-user') ? createTestUser() : currentUser;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "cases" | "shop" | "inventory");
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-4">Скины</h1>
        
        {/* Tabs */}
        <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
          <button
            onClick={() => setActiveTab("cases")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === "cases"
                ? "bg-orange-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Примеры
          </button>
          <button
            onClick={() => setActiveTab("shop")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === "shop"
                ? "bg-orange-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Магазин
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === "inventory"
                ? "bg-orange-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Мои выигрыши
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "cases" && (
        <CasesTab currentUser={validUser} onCoinsUpdate={onCoinsUpdate} />
      )}
      {activeTab === "shop" && (
        <ShopTab 
          currentUser={validUser} 
          onCoinsUpdate={onCoinsUpdate} 
          onTabChange={handleTabChange}
        />
      )}
      {activeTab === "inventory" && (
        <InventoryScreen currentUser={validUser} onCoinsUpdate={onCoinsUpdate} />
      )}
    </div>
  );
};

export default SkinsScreen;
