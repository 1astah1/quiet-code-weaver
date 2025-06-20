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

export type Screen = "main" | "skins" | "tasks" | "quiz" | "admin" | "settings";

const MainApp = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, isAuthenticated, signOut, updateUserCoins } = useAuth();
  const { toast } = useToast();

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

  // Helper function to handle screen changes with proper typing
  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  const renderScreen = () => {
    if (!user) return null;

    switch (currentScreen) {
      case "main":
        return <MainScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} onScreenChange={handleScreenChange} />;
      case "skins":
        return <SkinsScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "tasks":
        return <TasksScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "quiz":
        return <QuizScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "settings":
        return <SettingsScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case "admin":
        return user.isAdmin ? <AdminPanel /> : <MainScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} onScreenChange={handleScreenChange} />;
      default:
        return <MainScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} onScreenChange={handleScreenChange} />;
    }
  };

  // Показываем загрузку
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-white text-lg">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Показываем экран авторизации
  if (!isAuthenticated || !user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

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
        onScreenChange={handleScreenChange}
        onSignOut={signOut}
      />

      <main className="relative z-10">
        {renderScreen()}
      </main>

      {/* Modern Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-orange-500/30 z-40">
        <div className="flex justify-around items-center py-3 px-2">
          {[
            { id: "main", label: "Главная", icon: "🏠", gradient: "from-blue-500 to-blue-600" },
            { id: "skins", label: "Скины", icon: "🎯", gradient: "from-orange-500 to-red-500" },
            { id: "tasks", label: "Задания", icon: "📋", gradient: "from-green-500 to-green-600" },
            { id: "quiz", label: "Викторина", icon: "🧠", gradient: "from-purple-500 to-purple-600" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleScreenChange(tab.id)}
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-xl transition-all transform ${
                currentScreen === tab.id
                  ? `bg-gradient-to-r ${tab.gradient} text-white scale-105 shadow-lg`
                  : "text-gray-400 hover:text-orange-400 hover:scale-105"
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
