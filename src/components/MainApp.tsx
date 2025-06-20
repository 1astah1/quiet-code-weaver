
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MainScreen from "@/components/screens/MainScreen";
import SkinsScreen from "@/components/screens/SkinsScreen";
import TasksScreen from "@/components/screens/TasksScreen";
import QuizScreen from "@/components/screens/QuizScreen";
import AdminPanel from "@/components/AdminPanel";
import SettingsScreen from "@/components/settings/SettingsScreen";
import AuthScreen from "@/components/auth/AuthScreen";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { clearAllCache } from "@/utils/clearCache";

export type Screen = "main" | "skins" | "tasks" | "quiz" | "admin" | "settings";

const MainApp = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);
  const { user, isLoading, isAuthenticated, signOut, updateUserCoins } = useAuth();
  const { toast } = useToast();

  // Инициализация приложения
  useEffect(() => {
    const initializeApp = () => {
      console.log('Initializing app...');
      const hasCleared = sessionStorage.getItem('cache-cleared');
      if (!hasCleared) {
        console.log('Clearing cache on first load');
        clearAllCache();
        sessionStorage.setItem('cache-cleared', 'true');
      }
      setAppInitialized(true);
      console.log('App initialized');
    };

    initializeApp();
  }, []);

  // Обновляем монеты пользователя в базе данных
  const handleCoinsUpdate = async (newCoins: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', user.id);

      if (error) throw error;

      updateUserCoins(newCoins);
    } catch (error) {
      console.error('Error updating coins:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить баланс",
        variant: "destructive",
      });
    }
  };

  const renderScreen = () => {
    if (!user) return null;

    switch (currentScreen) {
      case "main":
        return <MainScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} onScreenChange={setCurrentScreen} />;
      case "skins":
        return <SkinsScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "tasks":
        return <TasksScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "quiz":
        return <QuizScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "settings":
        return <SettingsScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "admin":
        return user.isAdmin ? <AdminPanel /> : <MainScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} onScreenChange={setCurrentScreen} />;
      default:
        return <MainScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} onScreenChange={setCurrentScreen} />;
    }
  };

  console.log('MainApp render - appInitialized:', appInitialized, 'isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', !!user);

  // Показываем загрузку только если приложение не инициализировано или идет загрузка аутентификации
  if (!appInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-white text-lg">
            {!appInitialized ? "Инициализация..." : "Загрузка..."}
          </p>
        </div>
      </div>
    );
  }

  // Показываем экран авторизации если пользователь не авторизован
  if (!isAuthenticated || !user) {
    console.log('Showing auth screen - isAuthenticated:', isAuthenticated, 'user:', !!user);
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  console.log('Showing main app for user:', user.username);

  // Показываем основное приложение
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01MCA1MEwwIDB2MTAwbDUwLTUwTDEwMCAxMDBWMEw1MCA1MHoiIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyIvPgo8L3N2Zz4=')] bg-repeat"></div>
      </div>

      <Header 
        currentUser={user}
        onMenuClick={() => setSidebarOpen(true)}
      />
      
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={user}
        onScreenChange={setCurrentScreen}
        onSignOut={signOut}
      />

      <main className="relative z-10">
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-orange-500/30 z-40">
        <div className="flex justify-around items-center py-3">
          {[
            { id: "main", label: "Главная", icon: "🏠" },
            { id: "skins", label: "Скины", icon: "🎯" },
            { id: "tasks", label: "Задания", icon: "📋" },
            { id: "quiz", label: "Викторина", icon: "🧠" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentScreen(tab.id as Screen)}
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all ${
                currentScreen === tab.id
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-orange-400"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainApp;
