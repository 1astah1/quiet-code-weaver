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

  const loadUserData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Loading user data for:', user.id);
      
      // Максимально быстрая загрузка без лишних проверок
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !userData) {
        // Быстрая попытка поиска по auth_id
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: userByAuthId } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .maybeSingle();
          
          if (userByAuthId) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const userProfile = {
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
            };
            setCurrentUser(userProfile);
            setIsLoading(false);
            return;
          }
        }
        
        console.error('User data not found');
        setIsLoading(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userProfile = {
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
      };

      setCurrentUser(userProfile);
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

  const handleCoinsUpdate = async (newCoins: number) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, coins: newCoins } : null);
    }
  };

  const handleLivesUpdate = async (newLives: number) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, lives: newLives } : null);
    }
  };

  const handleStreakUpdate = async (newStreak: number) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, streak: newStreak } : null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setCurrentScreen('main');
  };

  const handleAuthSuccess = () => {
    loadUserData();
  };

  const handleCaseOpen = (caseItem: any) => {
    setOpeningCase(caseItem);
  };

  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  // Убираем лоадер - мгновенная загрузка
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

    // Прямой рендер без ленивых оберток для мгновенной работы
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
