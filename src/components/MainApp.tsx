
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
import { useAuth } from "@/hooks/useAuth";

export type Screen = 'main' | 'skins' | 'inventory' | 'quiz' | 'tasks' | 'rankings';

const MainApp = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [showSettings, setShowSettings] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, updateUserCoins, signOut } = useAuth();
  const { toast } = useToast();

  const handleCoinsUpdate = (newCoins: number) => {
    if (typeof newCoins === 'number' && newCoins >= 0) {
      updateUserCoins(newCoins);
    }
  };

  const handleLivesUpdate = (newLives: number) => {
    // Здесь можно добавить логику обновления жизней в useAuth хуке
    console.log('Lives updated:', newLives);
  };

  const handleStreakUpdate = (newStreak: number) => {
    // Здесь можно добавить логику обновления стрика в useAuth хуке
    console.log('Streak updated:', newStreak);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setCurrentScreen('main');
      setSidebarOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderCurrentScreen = () => {
    if (!user) return null;

    switch (currentScreen) {
      case 'skins':
        return <SkinsScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case 'inventory':
        return <InventoryScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case 'quiz':
        return (
          <QuizScreen 
            currentUser={user} 
            onBack={() => setCurrentScreen('main')}
            onCoinsUpdate={handleCoinsUpdate}
            onLivesUpdate={handleLivesUpdate}
            onStreakUpdate={handleStreakUpdate}
          />
        );
      case 'tasks':
        return <TasksScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} />;
      case 'rankings':
        return <RankingsScreen currentUser={user} />;
      default:
        return <MainScreen currentUser={user} onCoinsUpdate={handleCoinsUpdate} onScreenChange={setCurrentScreen} />;
    }
  };

  if (!user) {
    return (
      <div className="grid h-screen place-items-center bg-slate-900">
        <div className="text-white text-2xl">Загрузка данных пользователя...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header
        currentUser={{
          username: user.username,
          coins: user.coins,
          isPremium: user.isPremium
        }}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={{
          username: user.username,
          coins: user.coins,
          isPremium: user.isPremium,
          isAdmin: user.isAdmin
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

      {showSettings && user && (
        <SettingsScreen
          currentUser={{
            id: user.id,
            username: user.username,
            coins: user.coins,
            language_code: 'ru',
            sound_enabled: true,
            vibration_enabled: true,
            profile_private: false
          }}
          onCoinsUpdate={handleCoinsUpdate}
        />
      )}

      {showReferralModal && user && (
        <ReferralModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          currentUser={user}
          onCoinsUpdate={handleCoinsUpdate}
        />
      )}
    </div>
  );
};

export default MainApp;
