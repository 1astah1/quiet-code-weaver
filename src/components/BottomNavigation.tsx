
import { useTranslation } from "@/components/ui/use-translation";
import { Home, Box, BrainCircuit, CheckSquare, Briefcase, Gamepad } from 'lucide-react';

export type Screen = 
  | "main" 
  | "skins" 
  | "inventory" 
  | "settings" 
  | "tasks" 
  | "admin" 
  | "watermelon"
  | "quiz";

interface BottomNavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  isAdmin?: boolean;
  currentLanguage?: string;
}

const BottomNavigation = ({ 
  currentScreen, 
  onScreenChange, 
  isAdmin = false, 
  currentLanguage = 'ru' 
}: BottomNavigationProps) => {
  const { t } = useTranslation(currentLanguage);

  const navItems: { screen: Screen; label: string; icon: typeof Home }[] = [
    { screen: 'main', label: t('main'), icon: Home },
    { screen: 'skins', label: (t as any)('shop'), icon: Box },
    { screen: 'inventory', label: t('inventory'), icon: Briefcase },
    { screen: 'watermelon', label: t('game'), icon: Gamepad },
    { screen: 'tasks', label: t('tasks'), icon: CheckSquare },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/80 border-t border-slate-800 backdrop-blur-md z-40">
      <div className="max-w-3xl mx-auto grid grid-cols-5 items-center px-2 py-1.5 sm:py-2">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          const IconComponent = item.icon;
          return (
            <button
              key={item.screen}
              onClick={() => onScreenChange(item.screen)}
              className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors ${
                isActive
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
