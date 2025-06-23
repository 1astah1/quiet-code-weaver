
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import Sidebar from "@/components/Sidebar";
import BottomNavigation from "@/components/BottomNavigation";
import SkinsScreen from "@/components/screens/SkinsScreen";
import QuizScreen from "@/components/screens/QuizScreen";
import TasksScreen from "@/components/screens/TasksScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import LeaderboardScreen from "@/components/screens/LeaderboardScreen";
import MainScreen from "@/components/screens/MainScreen";
import InventoryScreen from "@/components/inventory/InventoryScreen";
import SecurityStatus from "@/components/security/SecurityStatus";
import { createTestUser } from "@/utils/uuid";

export type Screen = "main" | "skins" | "quiz" | "tasks" | "profile" | "leaderboard" | "inventory" | "settings" | "admin";

interface User {
  id: string;
  username: string;
  coins: number;
  quiz_lives: number;
  quiz_streak: number;
  is_admin?: boolean;
  language_code?: string;
  premium_until?: string;
}

const MainApp = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log("🚀 Initializing app...");
      
      // Получаем текущего пользователя из Supabase Auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        console.log("👤 Auth user found:", authUser.id);
        await loadUserProfile(authUser.id);
      } else {
        console.log("👤 No auth user found, using test user");
        const testUser = createTestUser();
        setUser({
          ...testUser,
          quiz_lives: 3,
          quiz_streak: 0,
          is_admin: false,
          language_code: 'ru'
        });
      }
    } catch (error) {
      console.error("❌ Error initializing app:", error);
      // Fallback to test user on error
      const testUser = createTestUser();
      setUser({
        ...testUser,
        quiz_lives: 3,
        quiz_streak: 0,
        is_admin: false,
        language_code: 'ru'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error) {
        console.error("❌ Error loading user profile:", error);
        throw error;
      }

      if (data) {
        console.log("✅ User profile loaded:", data);
        const mappedUser: User = {
          id: data.id,
          username: data.username,
          coins: data.coins || 0,
          quiz_lives: data.quiz_lives || 3,
          quiz_streak: data.quiz_streak || 0,
          is_admin: data.is_admin || false,
          language_code: data.language_code || 'ru',
          premium_until: data.premium_until
        };
        setUser(mappedUser);
      }
    } catch (error) {
      console.error("❌ Error loading user profile:", error);
      throw error;
    }
  };

  const handleCoinsUpdate = (newCoins: number) => {
    if (user) {
      setUser({ ...user, coins: newCoins });
    }
  };

  const handleLivesUpdate = (newLives: number) => {
    if (user) {
      setUser({ ...user, quiz_lives: newLives });
    }
  };

  const handleStreakUpdate = (newStreak: number) => {
    if (user) {
      setUser({ ...user, quiz_streak: newStreak });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCurrentScreen("main");
      setSidebarOpen(false);
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из аккаунта",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из аккаунта",
        variant: "destructive",
      });
    }
  };

  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <WelcomeScreen onUserLoad={setUser} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "main":
        return <MainScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} onScreenChange={setCurrentScreen} />;
      case "skins":
        return <SkinsScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "quiz":
        return <QuizScreen 
          currentUser={user} 
          onCoinsUpdate={handleCoinsUpdate}
          onBack={() => setCurrentScreen("main")}
          onLivesUpdate={handleLivesUpdate}
          onStreakUpdate={handleStreakUpdate}
        />;
      case "tasks":
        return <TasksScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "profile":
        return <ProfileScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "leaderboard":
        return <LeaderboardScreen />;
      case "inventory":
        return <InventoryScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      default:
        return <MainScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} onScreenChange={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onScreenChange={setCurrentScreen}
        currentUser={{
          username: user.username,
          coins: user.coins,
          isPremium: !!user.premium_until,
          isAdmin: user.is_admin || false,
          avatar_url: undefined,
          language_code: user.language_code
        }}
        onSignOut={handleSignOut}
      />

      <main className="pb-16 sm:pb-20">
        {renderScreen()}
      </main>

      <BottomNavigation
        currentScreen={currentScreen}
        onScreenChange={handleScreenChange}
        currentLanguage={user.language_code}
      />

      <SecurityStatus />
    </div>
  );
};

export default MainApp;
