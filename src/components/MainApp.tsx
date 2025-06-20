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

const MainApp = () => {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [showSettings, setShowSettings] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  const [isAuth, setIsAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    coins: number;
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      setIsAuth(!!session);

      if (session?.user) {
        loadUserData(session.user.id);
      }
    };

    checkAuth();

    supabase.auth.onAuthStateChange((event, session) => {
      setIsAuth(!!session);

      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, coins')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Ошибка при загрузке данных пользователя:", error);
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось загрузить данные пользователя.",
        });
        return;
      }

      setCurrentUser({
        id: user.id,
        username: user.username,
        coins: user.coins,
      });
    } catch (error) {
      console.error("Ошибка при загрузке данных пользователя:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить данные пользователя.",
      });
    }
  };

  const handleCoinsUpdate = (newCoins: number) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, coins: newCoins });
    }
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
        return <MainScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
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
        currentUser={currentUser}
        onShowSettings={() => setShowSettings(true)}
        onShowReferral={() => setShowReferralModal(true)}
      />

      <div className="container mx-auto flex py-6">
        <Sidebar
          currentScreen={currentScreen}
          onScreenChange={setCurrentScreen}
          onShowSettings={() => setShowSettings(true)}
          onShowReferral={() => setShowReferralModal(true)}
          currentUser={currentUser}
        />

        <main className="flex-1 p-4">
          {renderCurrentScreen()}
        </main>
      </div>

      {showSettings && (
        <SettingsScreen
          onClose={() => setShowSettings(false)}
          currentUser={currentUser}
          onCoinsUpdate={handleCoinsUpdate}
        />
      )}

      {showReferralModal && (
        <ReferralModal
          onClose={() => setShowReferralModal(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default MainApp;
