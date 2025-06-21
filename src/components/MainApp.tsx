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
import { useToast } from "@/hooks/use-toast";

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
    if (!user?.id) return;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user data:', error);
        return;
      }

      // Get auth user data for avatar
      const { data: { user: authUser } } = await supabase.auth.getUser();

      setCurrentUser({
        id: userData.id,
        username: userData.username || 'Пользователь',
        coins: userData.coins || 0,
        lives: userData.quiz_lives || 5,
        streak: userData.quiz_streak || 0,
        isPremium: userData.premium_until ? new Date(userData.premium_until) > new Date() : false,
        isAdmin: userData.is_admin || false,
        avatar_url: authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture
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

  const handleCoinsUpdate = (newCoins: number) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, coins: newCoins } : null);
    }
  };

  const handleLivesUpdate = (newLives: number) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, lives: newLives } : null);
    }
  };

  const handleStreakUpdate = (newStreak: number) => {
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

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-40">
          <div className="grid grid-cols-4 max-w-md mx-auto">
            <button
              onClick={() => setCurrentScreen('main')}
              className={`flex flex-col items-center py-2 px-1 text-xs ${
                currentScreen === 'main' ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <span className="text-lg mb-1">🏠</span>
              <span>Главная</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('skins')}
              className={`flex flex-col items-center py-2 px-1 text-xs ${
                currentScreen === 'skins' ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <span className="text-lg mb-1">🎁</span>
              <span>Кейсы</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('quiz')}
              className={`flex flex-col items-center py-2 px-1 text-xs ${
                currentScreen === 'quiz' ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <span className="text-lg mb-1">🧠</span>
              <span>Викторина</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('tasks')}
              className={`flex flex-col items-center py-2 px-1 text-xs ${
                currentScreen === 'tasks' ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <span className="text-lg mb-1">📋</span>
              <span>Задания</span>
            </button>
          </div>
        </div>

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
