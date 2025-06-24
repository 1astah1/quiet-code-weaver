import { Settings, Coins } from "lucide-react";
import { useTranslation } from "@/components/ui/use-translation";

interface HeaderProps {
  currentUser: {
    username: string;
    coins: number;
    isPremium: boolean;
    avatar_url?: string;
    language_code?: string;
  };
  onMenuClick: () => void;
}

const Header = ({ currentUser, onMenuClick }: HeaderProps) => {
  const { t } = useTranslation(currentUser.language_code);

  return (
    <header className="relative z-30 bg-gray-900/90 backdrop-blur-sm border-b border-orange-500/30 px-2 mobile-small:px-3 mobile-medium:px-4 mobile-large:px-4 sm:px-6 md:px-8 lg:px-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-2 mobile-small:py-2.5 mobile-medium:py-3 mobile-large:py-3 sm:py-3">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-1.5 mobile-small:p-2 mobile-medium:p-2 mobile-large:p-2 sm:p-2 rounded-lg bg-gray-800/50 border border-orange-500/30 hover:bg-orange-500/20 transition-all"
        >
          <Settings className="w-3.5 h-3.5 mobile-small:w-4 mobile-small:h-4 mobile-medium:w-4 mobile-medium:h-4 mobile-large:w-5 mobile-large:h-5 sm:w-5 sm:h-5 text-orange-400" />
        </button>

        {/* Logo */}
        <div className="flex-1 text-center">
          <h1 className="text-base mobile-small:text-lg mobile-medium:text-lg mobile-large:text-xl sm:text-xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text">
            FastMarket
          </h1>
        </div>

        {/* User Info & Coins */}
        <div className="flex items-center space-x-1.5 mobile-small:space-x-2 mobile-medium:space-x-2 mobile-large:space-x-3 sm:space-x-3">
          {/* User Avatar */}
          <div className="w-5 h-5 mobile-small:w-6 mobile-small:h-6 mobile-medium:w-7 mobile-medium:h-7 mobile-large:w-8 mobile-large:h-8 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
            {currentUser.avatar_url ? (
              <img 
                src={currentUser.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-xs font-bold">
                {currentUser.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Coins */}
          <div className="flex items-center space-x-0.5 mobile-small:space-x-1 mobile-medium:space-x-1 mobile-large:space-x-1 sm:space-x-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full px-1.5 mobile-small:px-2 mobile-medium:px-2 mobile-large:px-3 sm:px-3 py-0.5 mobile-small:py-1 mobile-medium:py-1 mobile-large:py-1 sm:py-1">
            <Coins className="w-2.5 h-2.5 mobile-small:w-3 mobile-small:h-3 mobile-medium:w-3 mobile-medium:h-3 mobile-large:w-4 mobile-large:h-4 sm:w-4 sm:h-4 text-yellow-200" />
            <span className="text-white font-bold text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-sm">{currentUser.coins.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
