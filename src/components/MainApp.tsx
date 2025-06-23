import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MainScreen from "@/components/screens/MainScreen";
import SkinsScreen from "@/components/screens/SkinsScreen";
import QuizScreen from "@/components/screens/QuizScreen";
import TasksScreen from "@/components/screens/TasksScreen";
import InventoryScreen from "@/components/inventory/InventoryScreen";
import SettingsScreen from "@/components/settings/SettingsScreen";
import AdminPanel from "@/components/AdminPanel";
import AuthScreen from "@/components/auth/AuthScreen";
import CaseOpeningAnimation from "@/components/CaseOpeningAnimation";
import SecurityMonitor from "@/components/security/SecurityMonitor";
import { useToast } from "@/hooks/use-toast";
import { auditLog } from "@/utils/security";
import BottomNavigation from "@/components/BottomNavigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useCriticalImagePreloader } from "@/hooks/useImagePreloader";

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
  console.log('🚀 [MAIN_APP] Component mounting/rendering');
  
  // Предзагружаем критические изображения
  useCriticalImagePreloader();
  
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openingCase, setOpeningCase] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useTranslation(currentUser?.language_code);

  // Логирование изменений состояния
  useEffect(() => {
    console.log('📊 [MAIN_APP] State change:', {
      hasUser: !!user,
      userId: user?.id,
      authLoading,
      isLoading,
      currentScreen,
      hasCurrentUser: !!currentUser
    });
  }, [user, authLoading, isLoading, currentScreen, currentUser]);

  const loadUserData = async () => {
    console.log('👤 [MAIN_APP] Starting loadUserData for:', user?.id);
    
    if (!user?.id) {
      console.log('❌ [MAIN_APP] No user ID, stopping load');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 [MAIN_APP] Validating user ID format...');
      
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) {
        console.error('❌ [MAIN_APP] Invalid user ID format detected:', user.id);
        await signOut();
        return;
      }
      
      console.log('📡 [MAIN_APP] Searching user by internal ID...');
      let { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      console.log('📊 [MAIN_APP] Internal ID search result:', { found: !!userData, error: !!error });

      if (!userData && user.id) {
        console.log('📡 [MAIN_APP] Searching user by auth_id...');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: userByAuthId, error: authError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .maybeSingle();
          
          console.log('📊 [MAIN_APP] Auth ID search result:', { found: !!userByAuthId, error: !!authError });
          
          if (!authError && userByAuthId) {
            userData = userByAuthId;
            error = null;
          }
        }
      }

      if (error) {
        console.error('❌ [MAIN_APP] User data loading error:', error);
        await auditLog(user.id, 'user_data_load_failed', { error: error.message }, false);
        
        if (error.code === 'PGRST301' || error.code === 'PGRST116') {
          console.log('🚪 [MAIN_APP] Critical error, signing out...');
          await signOut();
          return;
        }
        
        setIsLoading(false);
        return;
      }

      if (!userData) {
        console.error('❌ [MAIN_APP] User data not found in database');
        toast({
          title: t('error'),
          description: t('userDataNotFound'),
          variant: "destructive",
        });
        await signOut();
        return;
      }

      console.log('🔍 [MAIN_APP] Validating user data integrity...');
      if (userData.coins < 0 || userData.coins > 10000000) {
        console.warn('⚠️ [MAIN_APP] Suspicious coin amount detected:', userData.coins);
        await auditLog(userData.id, 'suspicious_coin_amount', { coins: userData.coins }, false);
      }

      console.log('👤 [MAIN_APP] Getting auth user avatar...');
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const userProfile = {
        id: userData.id,
        username: userData.username || t('user'),
        coins: Math.max(0, Math.min(userData.coins || 0, 10000000)),
        lives: Math.max(0, Math.min(userData.quiz_lives || 5, 10)),
        streak: Math.max(0, userData.quiz_streak || 0),
        isPremium: userData.premium_until ? new Date(userData.premium_until) > new Date() : false,
        isAdmin: userData.is_admin || false,
        avatar_url: authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture,
        language_code: userData.language_code || 'ru',
        sound_enabled: userData.sound_enabled,
        vibration_enabled: userData.vibration_enabled,
        profile_private: userData.profile_private
      };

      console.log('✅ [MAIN_APP] User profile created:', {
        id: userProfile.id,
        username: userProfile.username,
        coins: userProfile.coins,
        isAdmin: userProfile.isAdmin
      });

      setCurrentUser(userProfile);
      await auditLog(userData.id, 'user_data_loaded', { username: userData.username });
    } catch (error) {
      console.error('💥 [MAIN_APP] Unexpected error in loadUserData:', error);
      console.error('💥 [MAIN_APP] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      await auditLog(user.id, 'user_data_load_error', { error: String(error) }, false);
      
      console.log('🚪 [MAIN_APP] Signing out due to unexpected error...');
      await signOut();
    } finally {
      console.log('⏹️ [MAIN_APP] loadUserData completed, setting loading to false');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 [MAIN_APP] User effect triggered:', { hasUser: !!user, authLoading });
    
    if (user) {
      loadUserData();
    } else if (!authLoading) {
      console.log('📝 [MAIN_APP] No user and auth not loading, setting loading to false');
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const handleCoinsUpdate = async (newCoins: number) => {
    console.log('💰 [MAIN_APP] Coins update requested:', { oldCoins: currentUser?.coins, newCoins });
    
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, coins: newCoins } : null);
      await auditLog(currentUser.id, 'coins_updated', { newBalance: newCoins });
      console.log('✅ [MAIN_APP] Coins updated successfully');
    }
  };

  const handleLivesUpdate = async (newLives: number) => {
    console.log('❤️ [MAIN_APP] Lives update requested:', { oldLives: currentUser?.lives, newLives });
    
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, lives: newLives } : null);
      await auditLog(currentUser.id, 'lives_updated', { newLives });
      console.log('✅ [MAIN_APP] Lives updated successfully');
    }
  };

  const handleStreakUpdate = async (newStreak: number) => {
    console.log('🔥 [MAIN_APP] Streak update requested:', { oldStreak: currentUser?.streak, newStreak });
    
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, streak: newStreak } : null);
      await auditLog(currentUser.id, 'streak_updated', { newStreak });
      console.log('✅ [MAIN_APP] Streak updated successfully');
    }
  };

  const handleSignOut = async () => {
    console.log('🚪 [MAIN_APP] Sign out requested');
    
    try {
      if (currentUser) {
        await auditLog(currentUser.id, 'user_signed_out', {});
      }
      
      console.log('🧹 [MAIN_APP] Clearing session data...');
      sessionStorage.clear();
      localStorage.removeItem('supabase.auth.token');
      
      console.log('📡 [MAIN_APP] Calling Supabase signOut...');
      await signOut();
      setCurrentUser(null);
      setCurrentScreen('main');
      console.log('✅ [MAIN_APP] Sign out completed successfully');
    } catch (error) {
      console.error('💥 [MAIN_APP] Error during sign out:', error);
      console.log('🔄 [MAIN_APP] Force clearing state and reloading...');
      setCurrentUser(null);
      window.location.reload();
    }
  };

  const handleAuthSuccess = () => {
    console.log('🎉 [MAIN_APP] Auth success, loading user data...');
    loadUserData();
  };

  const handleCaseOpen = (caseItem: any) => {
    console.log('📦 [MAIN_APP] Case open requested:', caseItem);
    setOpeningCase(caseItem);
  };

  const handleScreenChange = (screen: string) => {
    console.log('📱 [MAIN_APP] Screen change requested:', { from: currentScreen, to: screen });
    setCurrentScreen(screen as Screen);
  };

  console.log('🎨 [MAIN_APP] Rendering component:', { authLoading, isLoading, hasUser: !!user, hasCurrentUser: !!currentUser });

  if (authLoading || isLoading) {
    console.log('⏳ [MAIN_APP] Showing loading screen');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || !currentUser) {
    console.log('🔐 [MAIN_APP] Showing auth screen');
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const renderScreen = () => {
    console.log('🎯 [MAIN_APP] Rendering screen:', currentScreen);
    
    switch (currentScreen) {
      case 'main':
        return (
          <MainScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
            onScreenChange={setCurrentScreen}
          />
        );
      case 'skins':
        return (
          <SkinsScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
          />
        );
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
        return (
          <TasksScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
          />
        );
      case 'inventory':
        return (
          <InventoryScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
          />
        );
      case 'settings':
        return <SettingsScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      case 'admin':
        return currentUser.isAdmin ? <AdminPanel /> : (
          <MainScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
            onScreenChange={setCurrentScreen}
          />
        );
      default:
        return (
          <MainScreen 
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
            onScreenChange={setCurrentScreen}
          />
        );
    }
  };

  console.log('✅ [MAIN_APP] Rendering main application interface');

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
          <CaseOpeningAnimation
            caseItem={openingCase}
            onClose={() => setOpeningCase(null)}
            currentUser={currentUser}
            onCoinsUpdate={handleCoinsUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default MainApp;
