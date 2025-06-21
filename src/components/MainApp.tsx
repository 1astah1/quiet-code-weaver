
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AuthScreen from "@/components/auth/AuthScreen";
import SecurityMonitor from "@/components/security/SecurityMonitor";
import BottomNavigation from "@/components/BottomNavigation";
import LazyWrapper from "@/components/ui/LazyWrapper";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

// Прямые импорты для мгновенной загрузки
import MainScreen from "@/components/screens/MainScreen";
import SkinsScreen from "@/components/screens/SkinsScreen";
import QuizScreen from "@/components/screens/QuizScreen";
import TasksScreen from "@/components/screens/TasksScreen";
import InventoryScreen from "@/components/inventory/InventoryScreen";
import SettingsScreen from "@/components/settings/SettingsScreen";

// Только редко используемые компоненты остаются ленивыми
import {
  LazyAdminPanel,
  LazyCaseOpeningAnimation
} from "@/utils/lazyComponents";

export type Screen = 'main' | 'skins' | 'quiz' | 'tasks' | 'inventory' | 'settings' | 'admin';

interface CurrentUser {
  id: string;
  username: string;
  coins: number;
  lives: number;
  streak: number;
  isPremium: boolean;
  isAdmin: boolean;
  avatar_url?: string;
  language_code?: string;
  sound_enabled?: boolean;
  vibration_enabled?: boolean;
  profile_private?: boolean;
}

const MainApp = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openingCase, setOpeningCase] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useTranslation(currentUser?.language_code);

  // Оптимизированная загрузка пользователя с минимальными запросами
  const loadUserData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Loading user data for:', user.id);
      
      // Один запрос с максимально быстрой загрузкой
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, username, coins, quiz_lives, quiz_streak, premium_until, is_admin, language_code, sound_enabled, vibration_enabled, profile_private')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Пользователь не найден по ID, ищем по auth_id
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: userByAuthId } = await supabase
            .from('users')
            .select('id, username, coins, quiz_lives, quiz_streak, premium_until, is_admin, language_code, sound_enabled, vibration_enabled, profile_private')
            .eq('auth_id', authUser.id)
            .single();
          
          if (userByAuthId) {
            setCurrentUser({
              id: userByAuthId.id,
              username: userByAuthId.username || t('user'),
              coins: userByAuthId.coins || 0,
              lives: userByAuthId.quiz_lives || 5,
              streak: userByAuthId.quiz_streak || 0,
              isPremium: userByAuthId.premium_until ? new Date(userByAuthId.premium_until) > new Date() : false,
              isAdmin: userByAuthId.is_admin || false,
              avatar_url: authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture,
              language_code: userByAuthId.language_code || 'ru',
              sound_enabled: userByAuthId.sound_enabled,
              vibration_enabled: userByAuthId.vibration_enabled,
              profile_private: userByAuthId.profile_private
            });
            setIsLoading(false);
            return;
          }
        }
        
        console.error('User data not found');
        setIsLoading(false);
        return;
      }

      if (error || !userData) {
        console.error('Error loading user data:', error);
        setIsLoading(false);
        return;
      }

      // Получаем auth данные только один раз
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      setCurrentUser({
        id: userData.id,
        username: userData.username || t('user'),
        coins: userData.coins || 0,
        lives: userData.quiz_lives || 5,
        streak: userData.quiz_streak || 0,
        isPremium: userData.premium_until ? new Date(userData.premium_until) > new Date() : false,
        isAdmin: userData.is_admin || false,
        avatar_url: authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture,
        language_code: userData.language_code || 'ru',
        sound_enabled: userData.sound_enabled,
        vibration_enabled: userData.vibration_enabled,
        profile_private: userData.profile_private
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Оптимизированные обработчики обновления состояния
  const handleCoinsUpdate = (newCoins: number) => {
    setCurrentUser(prev => prev ? { ...prev, coins: newCoins } : null);
  };

  const handleLivesUpdate = (newLives: number) => {
    setCurrentUser(prev => prev ? { ...prev, lives: newLives } : null);
  };

  const handleStreakUpdate = (newStreak: number) => {
    setCurrentUser(prev => prev ? { ...prev, streak: newStreak } : null);
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setCurrentScreen('main');
  };

  const handleAuthSuccess = () => {
    loadUserData();
  };

  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  // Мгновенная загрузка без лишних проверок
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const renderScreen = () => {
    const commonProps = {
      currentUser,
      onCoinsUpdate: handleCoinsUpdate
    };

    switch (currentScreen) {
      case 'main':
        return (
          <MainScreen 
            {...commonProps}
            onScreenChange={setCurrentScreen}
          />
        );
      case 'skins':
        return <SkinsScreen {...commonProps} />;
      case 'quiz':
        return (
          <QuizScreen 
            currentUser={{
              id: currentUser.id,
              username: currentUser.username,
              coins: currentUser.coins,
              quiz_lives: currentUser.lives,
              quiz_streak: currentUser.streak
            }}
            onCoinsUpdate={handleCoinsUpdate}
            onBack={() => setCurrentScreen('main')}
            onLivesUpdate={handleLivesUpdate}
            onStreakUpdate={handleStreakUpdate}
          />
        );
      case 'tasks':
        return <TasksScreen {...commonProps} />;
      case 'inventory':
        return <InventoryScreen {...commonProps} />;
      case 'settings':
        return <SettingsScreen {...commonProps} />;
      case 'admin':
        return currentUser.isAdmin ? (
          <LazyWrapper className="min-h-screen">
            <LazyAdminPanel />
          </LazyWrapper>
        ) : (
          <MainScreen {...commonProps} onScreenChange={setCurrentScreen} />
        );
      default:
        return <MainScreen {...commonProps} onScreenChange={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <SecurityMonitor />
      
      <div className="flex flex-col h-screen">
        <Header 
          currentUser={currentUser}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <div className="flex-1 overflow-hidden">
          <main className="h-full w-full overflow-y-auto px-4 pb-20 sm:px-6 md:px-8 lg:px-10">
            <div className="max-w-7xl mx-auto">
              {renderScreen()}
            </div>
          </main>
        </div>

        <BottomNavigation 
          currentScreen={currentScreen}
          onScreenChange={handleScreenChange}
          currentLanguage={currentUser?.language_code}
        />

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
          onScreenChange={setCurrentScreen}
          onSignOut={handleSignOut}
        />

        {openingCase && (
          <LazyWrapper>
            <LazyCaseOpeningAnimation
              caseItem={openingCase}
              onClose={() => setOpeningCase(null)}
              currentUser={currentUser}
              onCoinsUpdate={handleCoinsUpdate}
            />
          </LazyWrapper>
        )}
      </div>
    </div>
  );
};

export default MainApp;
