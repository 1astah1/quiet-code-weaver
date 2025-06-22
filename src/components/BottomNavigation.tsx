
import { Home, Package, Trophy, Brain, Settings, ListTodo, Crown } from "lucide-react";

interface BottomNavigationProps {
  currentScreen: string;
  onScreenChange: (screen: 'main' | 'skins' | 'inventory' | 'quiz' | 'settings' | 'tasks' | 'leaderboard') => void;
}

const BottomNavigation = ({ currentScreen, onScreenChange }: BottomNavigationProps) => {
  const navItems = [
    { id: 'main', icon: Home, label: 'Главная' },
    { id: 'skins', icon: Package, label: 'Скины' },
    { id: 'inventory', icon: Trophy, label: 'Инвентарь' },
    { id: 'leaderboard', icon: Crown, label: 'Топ' },
    { id: 'quiz', icon: Brain, label: 'Викторина' },
    { id: 'tasks', icon: ListTodo, label: 'Задания' },
    { id: 'settings', icon: Settings, label: 'Настройки' },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-md border-t border-white/20">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onScreenChange(item.id as any)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'text-purple-300 bg-white/10' 
                  : 'text-gray-400 hover:text-purple-200'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
