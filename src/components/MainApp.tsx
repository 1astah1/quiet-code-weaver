
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

      setCurrentUser({
        id: userData.id,
        username: userData.username || 'Пользователь',
        coins: userData.coins || 0,
        lives: userData.lives || 5,
        streak: userData.streak || 0,
        isPremium: userData.is_premium || false,
        isAdmin: userData.is_admin || false,
        avatar_url: userData.avatar_url
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
    return <AuthScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'main':
        return (
          <MainScreen 
            currentUser={currentUser}
            onCaseOpen={setOpeningCase}
            onCoinsUpdate={handleCoinsUpdate}
          />
        );
      case 'skins':
        return (
          <SkinsScreen 
            currentUser={currentUser}
            onCaseOpen={setOpeningCase}
            onCoinsUpdate={handleCoinsUpdate}
          />
        );
      case 'quiz':
        return (
          <QuizScreen 
            currentUser={currentUser}
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
        return <SettingsScreen />;
      case 'admin':
        return currentUser.isAdmin ? <AdminPanel /> : <MainScreen currentUser={currentUser} onCaseOpen={setOpeningCase} onCoinsUpdate={handleCoinsUpdate} />;
      default:
        return (
          <MainScreen 
            currentUser={currentUser}
            onCaseOpen={setOpeningCase}
            onCoinsUpdate={handleCoinsUpdate}
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
          <main className="h-full w-full overflow-y-auto px-4 pb-4 sm:px-6 md:px-8 lg:px-10">
            <div className="max-w-7xl mx-auto">
              {renderScreen()}
            </div>
          </main>
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
