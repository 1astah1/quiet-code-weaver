import { X, User, Crown, Gift, MessageCircle, Settings, Shield, LogOut } from "lucide-react";
import { Screen } from "./MainApp";

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
  const handleScreenChange = (screen: Screen) => {
    onScreenChange(screen);
    onClose();
  };

  const handleAdminClick = () => {
    if (currentUser.isAdmin) {
      handleScreenChange("admin");
    }
  };

  const handleSignOut = () => {
    onSignOut();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-gray-900/95 backdrop-blur-sm border-r border-orange-500/30 z-50 transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-orange-400">Настройки</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Profile Section */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-orange-500/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center overflow-hidden">
                {currentUser.avatar_url ? (
                  <img 
                    src={currentUser.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold">{currentUser.username}</h3>
                <p className="text-gray-400 text-sm">
                  {currentUser.isPremium ? "Premium пользователь" : "Обычный пользователь"}
                </p>
              </div>
            </div>
            
            {/* Premium Button */}
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3 mb-2 hover:from-purple-700 hover:to-pink-700 transition-all">
              <div className="flex items-center justify-center space-x-2">
                <Crown className="w-5 h-5 text-yellow-300" />
                <span className="text-white font-semibold">
                  {currentUser.isPremium ? "Premium активен" : "Получить Premium"}
                </span>
              </div>
              {!currentUser.isPremium && (
                <p className="text-xs text-purple-200 mt-1">3 дня бесплатно, затем $5</p>
              )}
            </button>
            
            {/* Steam Connect */}
            <button className="w-full bg-blue-600 rounded-lg p-3 hover:bg-blue-700 transition-all">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 bg-white rounded text-blue-600 flex items-center justify-center text-xs font-bold">S</div>
                <span className="text-white font-medium">Подключить Steam</span>
              </div>
            </button>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <div className="bg-gray-800/30 rounded-lg p-3">
              <h4 className="text-orange-400 font-semibold mb-2">Мои выигрыши</h4>
              <p className="text-gray-400 text-sm">Здесь отображаются ваши призы</p>
            </div>

            <button 
              onClick={() => handleScreenChange("settings")}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-800/30 transition-all"
            >
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-orange-400" />
                <span className="text-white">Поддержка</span>
              </div>
            </button>

            <button 
              onClick={() => handleScreenChange("settings")}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-800/30 transition-all"
            >
              <div className="flex items-center space-x-3">
                <Gift className="w-5 h-5 text-orange-400" />
                <span className="text-white">Промокод</span>
              </div>
            </button>

            <button 
              onClick={() => handleScreenChange("settings")}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-800/30 transition-all"
            >
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-orange-400" />
                <span className="text-white">Настройки</span>
              </div>
            </button>

            {/* Admin Panel Button */}
            {currentUser.isAdmin && (
              <button 
                onClick={handleAdminClick}
                className="w-full text-left p-3 rounded-lg bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-semibold">Админка</span>
                </div>
              </button>
            )}

            {/* Sign Out Button */}
            <button 
              onClick={handleSignOut}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-800/30 transition-all border-t border-gray-700/50 mt-4"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Выйти</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;