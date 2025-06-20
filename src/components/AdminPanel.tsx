
import { useState } from "react";
import { Users, MessageSquare, Gift, Trophy, Settings } from "lucide-react";
import AdminUsersPanel from "./admin/AdminUsersPanel";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", label: "Пользователи", icon: Users },
    { id: "reviews", label: "Отзывы", icon: MessageSquare },
    { id: "freebies", label: "Бонусы", icon: Gift },
    { id: "achievements", label: "Достижения", icon: Trophy },
    { id: "settings", label: "Настройки", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <AdminUsersPanel />;
      case "reviews":
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Управление отзывами</h2>
            <p className="text-gray-400">Функциональность в разработке</p>
          </div>
        );
      case "freebies":
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Управление бонусами</h2>
            <p className="text-gray-400">Функциональность в разработке</p>
          </div>
        );
      case "achievements":
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Управление достижениями</h2>
            <p className="text-gray-400">Функциональность в разработке</p>
          </div>
        );
      case "settings":
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Настройки системы</h2>
            <p className="text-gray-400">Функциональность в разработке</p>
          </div>
        );
      default:
        return <AdminUsersPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Панель администратора</h1>
        
        {/* Табы */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Контент */}
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPanel;
