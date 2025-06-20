
import { useState } from "react";
import { X, Settings, LogOut, Crown, Shield, Coins } from "lucide-react";
import { Screen } from "@/components/MainApp";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    username: string;
    coins: number;
    isPremium: boolean;
    isAdmin: boolean;
    avatar_url?: string;
  };
  onScreenChange: (screen: Screen) => void;
  onSignOut: () => void;
}

const Sidebar = ({ isOpen, onClose, currentUser, onScreenChange, onSignOut }: SidebarProps) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsClick = () => {
    setShowSettings(true);
    onScreenChange('settings');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-gray-900 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Меню</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-orange-500/20">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                {currentUser.avatar_url ? (
                  <img 
                    src={currentUser.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-bold">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-white font-bold">{currentUser.username}</h3>
                  {currentUser.isPremium && (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  )}
                  {currentUser.isAdmin && (
                    <Shield className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">{currentUser.coins.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-800/50 text-gray-300 hover:text-white transition-all"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Настройки</span>
            </button>

            {currentUser.isAdmin && (
              <button
                onClick={() => {
                  onScreenChange('admin');
                  onClose();
                }}
                className="w-full flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-800/50 text-gray-300 hover:text-white transition-all"
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Админ панель</span>
              </button>
            )}
          </div>

          {/* Sign Out */}
          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-red-600/20 hover:bg-red-600/30 rounded-xl text-red-400 hover:text-red-300 transition-all border border-red-500/30"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
