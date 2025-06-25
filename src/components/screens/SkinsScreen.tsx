import { useState } from "react";
import CasesTab from "@/components/skins/CasesTab";
import ShopTab from "@/components/skins/ShopTab";
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
  const [activeTab, setActiveTab] = useState<"cases" | "shop">("cases");

  const validUser = currentUser.id.includes('test-user') ? createTestUser() : currentUser;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "cases" | "shop");
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-20 px-2 sm:px-4 md:px-6 pt-2 sm:pt-4">
      {/* Mobile-first Tabs */}
      <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 mb-4 sm:mb-6 gap-1">
        <button
          onClick={() => setActiveTab("cases")}
          className={`flex-1 py-2 px-1 sm:px-4 rounded-md font-medium transition-all text-xs sm:text-sm ${
            activeTab === "cases"
              ? "bg-orange-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Кейсы
        </button>
        <button
          onClick={() => setActiveTab("shop")}
          className={`flex-1 py-2 px-1 sm:px-4 rounded-md font-medium transition-all text-xs sm:text-sm ${
            activeTab === "shop"
              ? "bg-orange-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Магазин
        </button>
      </div>

      {/* Tab Content */}
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
    </div>
  );
};

export default SkinsScreen;
