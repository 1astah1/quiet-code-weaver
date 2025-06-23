
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import AuthScreen from "@/components/auth/AuthScreen";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log("🚀 Initializing app...");
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.id);
          
          if (event === 'SIGNED_IN' && session?.user) {
            setIsAuthenticated(true);
            await loadUserProfile(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      );

      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log("👤 Found existing session:", session.user.id);
        setIsAuthenticated(true);
        await loadUserProfile(session.user.id);
      } else {
        console.log("👤 No existing session found");
        setIsAuthenticated(false);
      }

      // Cleanup function for subscription
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("❌ Error initializing app:", error);
      setIsAuthenticated(false);
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

      if (error && error.code !== 'PGRST116') {
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
      } else {
        // User doesn't exist in our database, create one
        console.log("Creating new user profile...");
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          const newUser = {
            auth_id: authUser.user.id,
            username: authUser.user.email?.split('@')[0] || 'User',
            coins: 1000,
            quiz_lives: 3,
            quiz_streak: 0,
            is_admin: false,
            language_code: 'ru'
          };

          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

          if (createError) {
            console.error("❌ Error creating user:", createError);
          } else if (createdUser) {
            setUser({
              id: createdUser.id,
              username: createdUser.username,
              coins: createdUser.coins,
              quiz_lives: createdUser.quiz_lives,
              quiz_streak: createdUser.quiz_streak,
              is_admin: createdUser.is_admin,
              language_code: createdUser.language_code,
              premium_until: createdUser.premium_until
            });
          }
        }
      }
    } catch (error) {
      console.error("❌ Error loading user profile:", error);
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
      setIsAuthenticated(false);
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

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  if (!user) {
    return <LoadingScreen />;
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
