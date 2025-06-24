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

  const validUser = currentUser.id.includes('test-user') ? createTestUser() : currentUser;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "cases" | "shop" | "inventory");
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-20 px-2 mobile-small:px-3 mobile-medium:px-4 mobile-large:px-4 sm:px-4 md:px-6 pt-2 mobile-small:pt-3 mobile-medium:pt-4 mobile-large:pt-4 sm:pt-4">
      {/* Header */}
      <div className="mb-3 mobile-small:mb-4 mobile-medium:mb-4 mobile-large:mb-5 sm:mb-6">
        <h1 className="text-base mobile-small:text-lg mobile-medium:text-lg mobile-large:text-xl sm:text-xl md:text-2xl font-bold text-white mb-2 mobile-small:mb-3 mobile-medium:mb-3 mobile-large:mb-3 sm:mb-4">Скины</h1>
        
        {/* Tabs - адаптированные под все мобильные устройства */}
        <div className="flex bg-slate-800/50 rounded-lg p-0.5 mobile-small:p-1 mobile-medium:p-1 mobile-large:p-1 sm:p-1 border border-slate-700/50">
          <button
            onClick={() => setActiveTab("cases")}
            className={`flex-1 py-1 mobile-small:py-1.5 mobile-medium:py-1.5 mobile-large:py-2 sm:py-2 px-1 mobile-small:px-2 mobile-medium:px-2 mobile-large:px-3 sm:px-4 rounded-md font-medium transition-all text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-sm sm:text-sm ${
              activeTab === "cases"
                ? "bg-orange-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Примеры
          </button>
          <button
            onClick={() => setActiveTab("shop")}
            className={`flex-1 py-1 mobile-small:py-1.5 mobile-medium:py-1.5 mobile-large:py-2 sm:py-2 px-1 mobile-small:px-2 mobile-medium:px-2 mobile-large:px-3 sm:px-4 rounded-md font-medium transition-all text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-sm sm:text-sm ${
              activeTab === "shop"
                ? "bg-orange-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Магазин
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-1 mobile-small:py-1.5 mobile-medium:py-1.5 mobile-large:py-2 sm:py-2 px-1 mobile-small:px-2 mobile-medium:px-2 mobile-large:px-3 sm:px-4 rounded-md font-medium transition-all text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-sm sm:text-sm ${
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
