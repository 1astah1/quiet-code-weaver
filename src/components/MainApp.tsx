import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cleanupAuthState } from "@/utils/authCleanup";
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
  const [authInitialized, setAuthInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log("🚀 Initializing authentication...");
        
        // Небольшая задержка для предотвращения race conditions
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Сначала устанавливаем слушатель изменений состояния auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("🔄 Auth state changed:", event, session?.user?.id);
            
            if (!mounted) return;

            if (event === 'SIGNED_IN' && session?.user) {
              console.log("✅ User signed in");
              setIsAuthenticated(true);
              // Отложенная загрузка профиля для предотвращения deadlock
              setTimeout(() => {
                if (mounted) {
                  loadUserProfile(session.user.id);
                }
              }, 200);
            } else if (event === 'SIGNED_OUT') {
              console.log("👋 User signed out");
              handleSignOut();
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              console.log("🔄 Token refreshed");
              setTimeout(() => {
                if (mounted) {
                  loadUserProfile(session.user.id);
                }
              }, 100);
            }
          }
        );

        // Затем проверяем существующую сессию
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Session error:", error);
          cleanupAuthState();
          setIsAuthenticated(false);
        } else if (session?.user && mounted) {
          console.log("✅ Found existing session:", session.user.id);
          setIsAuthenticated(true);
          await loadUserProfile(session.user.id);
        } else {
          console.log("ℹ️ No existing session found");
          setIsAuthenticated(false);
        }

        // Cleanup subscription when component unmounts
        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        if (mounted) {
          cleanupAuthState();
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setAuthInitialized(true);
          setLoading(false);
        }
      }
    };

    // Отложенная инициализация
    initTimeout = setTimeout(() => {
      if (mounted) {
        initializeAuth();
      }
    }, 100);

    return () => {
      mounted = false;
      if (initTimeout) clearTimeout(initTimeout);
    };
  }, []);

  const loadUserProfile = async (authId: string) => {
    try {
      console.log("🔄 Loading user profile for:", authId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();

      if (error) {
        console.error("❌ Error loading user profile:", error);
        return;
      }

      if (data) {
        console.log("✅ User profile loaded:", data.username);
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
        console.log("📝 Creating new user profile...");
        await createNewUserProfile(authId);
      }
    } catch (error) {
      console.error("❌ Error in loadUserProfile:", error);
    }
  };

  const createNewUserProfile = async (authId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      const newUser = {
        auth_id: authId,
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
        .maybeSingle();

      if (createError) {
        console.error("❌ Error creating user:", createError);
      } else if (createdUser) {
        console.log("✅ New user created:", createdUser.username);
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
        
        toast({
          title: "Добро пожаловать!",
          description: "Вы получили 1000 стартовых монет!",
        });
      }
    } catch (error) {
      console.error("❌ Error creating user profile:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log("👋 Signing out...");
      
      // Очищаем состояние
      setUser(null);
      setIsAuthenticated(false);
      setCurrentScreen("main");
      setSidebarOpen(false);
      
      // Очищаем auth состояние
      cleanupAuthState();
      
      // Глобальный выход
      await supabase.auth.signOut({ scope: 'global' });
      
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из аккаунта",
      });
    } catch (error) {
      console.error("❌ Error signing out:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из аккаунта",
        variant: "destructive",
      });
    }
  };

  const handleUserLoad = (userData: User) => {
    console.log("✅ User loaded from WelcomeScreen:", userData.username);
    setUser(userData);
    setIsAuthenticated(true);
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

  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

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

  if (loading || !authInitialized) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <WelcomeScreen onUserLoad={handleUserLoad} />;
  }

  if (!user) {
    return <LoadingScreen />;
  }

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
