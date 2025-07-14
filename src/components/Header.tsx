
import { useState } from "react";
import { Menu, Coins, Crown, Shield } from "lucide-react";
import { Badge } from "./ui/badge";

interface HeaderProps {
  currentUser: {
    username: string;
    coins: number;
    is_admin?: boolean;
    isPremium?: boolean;
  };
  onMenuClick: () => void;
}

const Header = ({ currentUser, onMenuClick }: HeaderProps) => {
  const [coinsAnimating, setCoinsAnimating] = useState(false);

  // Анимация при изменении баланса
  const handleCoinsChange = () => {
    setCoinsAnimating(true);
    setTimeout(() => setCoinsAnimating(false), 300);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md border-b border-slate-700/50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* User Info */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-white font-semibold text-sm">
                {currentUser.username}
              </span>
              {currentUser.isPremium && (
                <div title="Premium пользователь">
                  <Crown className="w-4 h-4 text-yellow-500" />
                </div>
              )}
              {currentUser.is_admin && (
                <div title="Администратор">
                  <Shield className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
            {currentUser.isPremium && (
              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500 px-1 py-0 w-fit">
                Premium
              </Badge>
            )}
          </div>
        </div>

        {/* Balance */}
        <div className={`flex items-center space-x-2 transition-all duration-300 ${coinsAnimating ? 'scale-110' : ''}`}>
          <div className="bg-gradient-to-r from-yellow-600 to-orange-500 rounded-full px-4 py-2 flex items-center space-x-2 shadow-lg">
            <Coins className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-lg min-w-0">
              {currentUser.coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          aria-label="Меню"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>
    </header>
  );
};

export default Header;
