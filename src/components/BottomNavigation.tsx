
import { useTranslation } from "@/hooks/useTranslation";
import { useSwipeGestures } from "@/hooks/useSwipeGestures";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface BottomNavigationProps {
  currentScreen: string;
  onScreenChange: (screen: string) => void;
  currentLanguage?: string;
}

const BottomNavigation = ({ currentScreen, onScreenChange, currentLanguage = 'ru' }: BottomNavigationProps) => {
  const { t } = useTranslation(currentLanguage);
  const { buttonFeedback } = useHapticFeedback();

  const screens = ['main', 'skins', 'quiz', 'tasks'];
  const currentIndex = screens.indexOf(currentScreen);

  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => {
      if (currentIndex < screens.length - 1) {
        buttonFeedback();
        onScreenChange(screens[currentIndex + 1]);
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        buttonFeedback();
        onScreenChange(screens[currentIndex - 1]);
      }
    },
    threshold: 30,
    velocity: 0.2
  });

  const handleTabClick = (screen: string) => {
    buttonFeedback();
    onScreenChange(screen);
  };

  return (
    <div 
      ref={swipeRef}
      className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-40 safe-area-bottom"
    >
      <div className="grid grid-cols-4 max-w-md mx-auto">
        <button
          onClick={() => handleTabClick('main')}
          className={`flex flex-col items-center py-2 px-1 text-xs transition-all duration-200 hover-scale ${
            currentScreen === 'main' ? 'text-orange-500 scale-105' : 'text-gray-400'
          }`}
        >
          <img 
            src="/lovable-uploads/47a122b5-c1e7-44cd-af3e-d4ae59ce6838.png" 
            alt={t('main')} 
            className={`w-6 h-6 mb-1 transition-all duration-200 ${
              currentScreen === 'main' ? 'brightness-0 invert scale-110' : 'opacity-60'
            }`}
          />
          <span className="transition-all duration-200">{t('main')}</span>
        </button>
        
        <button
          onClick={() => handleTabClick('skins')}
          className={`flex flex-col items-center py-2 px-1 text-xs transition-all duration-200 hover-scale ${
            currentScreen === 'skins' ? 'text-orange-500 scale-105' : 'text-gray-400'
          }`}
        >
          <img 
            src="/lovable-uploads/7872de96-7d2a-441b-a062-58e9068a686b.png" 
            alt={t('cases')} 
            className={`w-6 h-6 mb-1 transition-all duration-200 ${
              currentScreen === 'skins' ? 'brightness-0 invert scale-110' : 'opacity-60'
            }`}
          />
          <span className="transition-all duration-200">{t('cases')}</span>
        </button>
        
        <button
          onClick={() => handleTabClick('quiz')}
          className={`flex flex-col items-center py-2 px-1 text-xs transition-all duration-200 hover-scale ${
            currentScreen === 'quiz' ? 'text-orange-500 scale-105' : 'text-gray-400'
          }`}
        >
          <img 
            src="/lovable-uploads/60a00c47-4bb3-4bb2-b7f0-01299fbde885.png" 
            alt={t('quiz')} 
            className={`w-6 h-6 mb-1 transition-all duration-200 ${
              currentScreen === 'quiz' ? 'brightness-0 invert scale-110' : 'opacity-60'
            }`}
          />
          <span className="transition-all duration-200">{t('quiz')}</span>
        </button>
        
        <button
          onClick={() => handleTabClick('tasks')}
          className={`flex flex-col items-center py-2 px-1 text-xs transition-all duration-200 hover-scale ${
            currentScreen === 'tasks' ? 'text-orange-500 scale-105' : 'text-gray-400'
          }`}
        >
          <img 
            src="/lovable-uploads/bc1fd348-a889-4ecf-8b2a-d806d4a84459.png" 
            alt={t('tasks')} 
            className={`w-6 h-6 mb-1 transition-all duration-200 ${
              currentScreen === 'tasks' ? 'brightness-0 invert scale-110' : 'opacity-60'
            }`}
          />
          <span className="transition-all duration-200">{t('tasks')}</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
