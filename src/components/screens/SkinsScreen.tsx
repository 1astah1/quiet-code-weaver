
import { useState } from "react";
import CasesTab from "@/components/skins/CasesTab";
import ShopTab from "@/components/skins/ShopTab";
import InventoryScreen from "@/components/inventory/InventoryScreen";

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "cases" | "shop" | "inventory");
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">Скины</h1>
        
        {/* Tabs - более компактные на мобильных */}
        <div className="flex bg-slate-800/50 rounded-lg p-0.5 sm:p-1 border border-slate-700/50">
          <button
            onClick={() => setActiveTab("cases")}
            className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md font-medium transition-all text-xs sm:text-sm ${
              activeTab === "cases"
                ? "bg-orange-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Примеры
          </button>
          <button
            onClick={() => setActiveTab("shop")}
            className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md font-medium transition-all text-xs sm:text-sm ${
              activeTab === "shop"
                ? "bg-orange-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Магазин
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md font-medium transition-all text-xs sm:text-sm ${
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
        <CasesTab currentUser={currentUser} onCoinsUpdate={onCoinsUpdate} />
      )}
      {activeTab === "shop" && (
        <ShopTab 
          currentUser={currentUser} 
          onCoinsUpdate={onCoinsUpdate} 
          onTabChange={handleTabChange}
        />
      )}
      {activeTab === "inventory" && (
        <InventoryScreen currentUser={currentUser} onCoinsUpdate={onCoinsUpdate} />
      )}
    </div>
  );
};

export default SkinsScreen;
