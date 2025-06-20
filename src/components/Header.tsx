
import { Settings, Coins } from "lucide-react";

interface HeaderProps {
  currentUser: {
    username: string;
    coins: number;
    isPremium: boolean;
    avatar_url?: string;
  };
  onMenuClick: () => void;
}

const Header = ({ currentUser, onMenuClick }: HeaderProps) => {
  return (
    <header className="relative z-30 bg-gray-900/90 backdrop-blur-sm border-b border-orange-500/30 px-4 sm:px-6 md:px-8 lg:px-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg bg-gray-800/50 border border-orange-500/30 hover:bg-orange-500/20 transition-all"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
        </button>

        {/* Logo */}
        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text">
            FastMarket
          </h1>
        </div>

        {/* User Info & Coins */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* User Avatar */}
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
            {currentUser.avatar_url ? (
              <img 
                src={currentUser.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-bold">
                {currentUser.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Coins */}
          <div className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full px-2 sm:px-3 py-1">
            <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-200" />
            <span className="text-white font-bold text-xs sm:text-sm">{currentUser.coins.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
