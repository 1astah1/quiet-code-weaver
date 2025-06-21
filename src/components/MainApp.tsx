
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
import {
  LazyMainScreen,
  LazySkinsScreen,
  LazyQuizScreen,
  LazyTasksScreen,
  LazyInventoryScreen,
  LazySettingsScreen,
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
      
      // Быстрая загрузка данных пользователя без дополнительных проверок
      let { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Пользователь не найден, попробуем найти по auth_id
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: userByAuthId, error: authError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();
          
          if (!authError && userByAuthId) {
            userData = userByAuthId;
            error = null;
          }
        }
      }

      if (error || !userData) {
        console.error('User data not found');
        toast({
          title: t('error'),
          description: t('userDataNotFound'),
          variant: "destructive",
        });
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
      console.log('User data loaded');
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: t('error'),
        description: "Ошибка загрузки данных пользователя",
        variant: "destructive",
      });
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

  // Минимальный лоадер
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-white text-sm">{t('loading')}</p>
        </div>
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
          <LazyWrapper className="min-h-screen">
            <LazyMainScreen 
              {...commonProps}
              onScreenChange={setCurrentScreen}
            />
          </LazyWrapper>
        );
      case 'skins':
        return (
          <LazyWrapper className="min-h-screen">
            <LazySkinsScreen {...commonProps} />
          </LazyWrapper>
        );
      case 'quiz':
        return (
          <LazyWrapper className="min-h-screen">
            <LazyQuizScreen 
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
          </LazyWrapper>
        );
      case 'tasks':
        return (
          <LazyWrapper className="min-h-screen">
            <LazyTasksScreen {...commonProps} />
          </LazyWrapper>
        );
      case 'inventory':
        return (
          <LazyWrapper className="min-h-screen">
            <LazyInventoryScreen {...commonProps} />
          </LazyWrapper>
        );
      case 'settings':
        return (
          <LazyWrapper className="min-h-screen">
            <LazySettingsScreen {...commonProps} />
          </LazyWrapper>
        );
      case 'admin':
        return currentUser.isAdmin ? (
          <LazyWrapper className="min-h-screen">
            <LazyAdminPanel />
          </LazyWrapper>
        ) : (
          <LazyWrapper className="min-h-screen">
            <LazyMainScreen {...commonProps} onScreenChange={setCurrentScreen} />
          </LazyWrapper>
        );
      default:
        return (
          <LazyWrapper className="min-h-screen">
            <LazyMainScreen {...commonProps} onScreenChange={setCurrentScreen} />
          </LazyWrapper>
        );
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
