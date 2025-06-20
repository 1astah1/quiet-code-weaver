
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MainScreen from "./screens/MainScreen";
import SkinsScreen from "./screens/SkinsScreen";
import InventoryScreen from "./inventory/InventoryScreen";
import QuizScreen from "./screens/QuizScreen";
import TasksScreen from "./screens/TasksScreen";
import RankingsScreen from "./screens/RankingsScreen";
import SettingsScreen from "./settings/SettingsScreen";
import ReferralModal from "./ReferralModal";

export type Screen = 'main' | 'skins' | 'inventory' | 'quiz' | 'tasks' | 'rankings';

interface CurrentUser {
  id: string;
  username: string;
  coins: number;
  quiz_lives: number;
  quiz_streak: number;
  isPremium: boolean;
  isAdmin: boolean;
  referralCode?: string | null;
}

const MainApp = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [showSettings, setShowSettings] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isAuth, setIsAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        setIsAuth(!!session);

        if (session?.user) {
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuth(!!session);

      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      if (!userId) {
        console.error("Invalid user ID");
        return;
      }

      // Query only existing columns based on the schema
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, coins, quiz_lives, quiz_streak, is_admin, referral_code, premium_until')
        .eq('auth_id', userId)
        .single();

      if (error) {
        console.error("Error loading user data:", error);
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось загрузить данные пользователя.",
        });
        return;
      }

      if (user) {
        const isPremium = user.premium_until ? new Date(user.premium_until) > new Date() : false;
        
        setCurrentUser({
          id: user.id,
          username: user.username || 'Пользователь',
          coins: user.coins || 0,
          quiz_lives: user.quiz_lives || 3,
          quiz_streak: user.quiz_streak || 0,
          isPremium,
          isAdmin: user.is_admin || false,
          referralCode: user.referral_code,
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить данные пользователя.",
      });
    }
  };

  const handleCoinsUpdate = (newCoins: number) => {
    if (currentUser && typeof newCoins === 'number' && newCoins >= 0) {
      setCurrentUser({ ...currentUser, coins: newCoins });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentScreen('main');
    setSidebarOpen(false);
  };

  const renderCurrentScreen = () => {
    if (!currentUser) return null;

    switch (currentScreen) {
      case 'skins':
        return <SkinsScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      case 'inventory':
        return <InventoryScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      case 'quiz':
        return <QuizScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      case 'tasks':
        return <TasksScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      case 'rankings':
        return <RankingsScreen currentUser={currentUser} />;
      default:
        return <MainScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} onScreenChange={setCurrentScreen} />;
    }
  };

  if (!isAuth) {
    return <div className="grid h-screen place-items-center">
      <div className="text-white text-2xl">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header
        currentUser={{
          username: currentUser?.username || 'Пользователь',
          coins: currentUser?.coins || 0,
          isPremium: currentUser?.isPremium || false
        }}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={{
          username: currentUser?.username || 'Пользователь',
          coins: currentUser?.coins || 0,
          isPremium: currentUser?.isPremium || false,
          isAdmin: currentUser?.isAdmin || false
        }}
        onScreenChange={(screen: Screen) => {
          setCurrentScreen(screen);
          setSidebarOpen(false);
        }}
        onSignOut={handleSignOut}
        currentScreen={currentScreen}
        onShowSettings={() => setShowSettings(true)}
        onShowReferral={() => setShowReferralModal(true)}
      />

      <div className="container mx-auto flex py-6">
        <main className="flex-1 p-4">
          {renderCurrentScreen()}
        </main>
      </div>

      {showSettings && currentUser && (
        <SettingsScreen
          currentUser={{
            id: currentUser.id,
            username: currentUser.username,
            coins: currentUser.coins,
            language_code: 'ru',
            sound_enabled: true,
            vibration_enabled: true,
            profile_private: false
          }}
          onCoinsUpdate={handleCoinsUpdate}
        />
      )}

      {showReferralModal && currentUser && (
        <ReferralModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          currentUser={currentUser}
          onCoinsUpdate={handleCoinsUpdate}
        />
      )}
    </div>
  );
};

export default MainApp;
