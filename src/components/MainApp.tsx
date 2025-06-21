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

  const loadUserData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Loading user data for:', user.id);
      
      // Пытаемся найти пользователя сначала по внутреннему ID
      let { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Если не найден по внутреннему ID, ищем по auth_id
      if (!userData && user.id) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: userByAuthId, error: authError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .maybeSingle();
          
          if (!authError && userByAuthId) {
            userData = userByAuthId;
            error = null;
          }
        }
      }

      if (error) {
        console.error('Error loading user data:', error);
        await auditLog(user.id, 'user_data_load_failed', { error: error.message }, false);
        setIsLoading(false);
        return;
      }

      if (!userData) {
        console.error('User data not found in database');
        toast({
          title: "Ошибка",
          description: "Данные пользователя не найдены. Попробуйте перезайти.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get auth user data for avatar
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const userProfile = {
        id: userData.id,
        username: userData.username || 'Пользователь',
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
      await auditLog(userData.id, 'user_data_loaded', { username: userData.username });
    } catch (error) {
      console.error('Error loading user data:', error);
      await auditLog(user.id, 'user_data_load_error', { error: String(error) }, false);
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
      await auditLog(currentUser.id, 'coins_updated', { newBalance: newCoins });
    }
  };

  const handleLivesUpdate = async (newLives: number) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, lives: newLives } : null);
      await auditLog(currentUser.id, 'lives_updated', { newLives });
    }
  };

  const handleStreakUpdate = async (newStreak: number) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, streak: newStreak } : null);
      await auditLog(currentUser.id, 'streak_updated', { newStreak });
    }
  };

  const handleSignOut = async () => {
    if (currentUser) {
      await auditLog(currentUser.id, 'user_signed_out', {});
    }
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user || !currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const renderScreen = () => {
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
