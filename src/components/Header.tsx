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
    <header className="w-full bg-black/80 border-b border-slate-800 fixed top-0 left-0 z-40 backdrop-blur-md">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/favicon.ico" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded" />
          <span className="text-white font-bold text-base sm:text-xl tracking-tight">FastMarket</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-2 sm:px-3 py-1">
              <span className="text-white text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-[120px]">{currentUser.username}</span>
              <span className="flex items-center gap-1 text-yellow-400 text-xs sm:text-sm font-bold">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                {currentUser.coins}
              </span>
            </div>
          )}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold transition-colors"
            >
              Настройки
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
