import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthScreen from '@/components/auth/AuthScreen';
import MainScreen from '@/components/screens/MainScreen';
import InventoryScreen from '@/components/inventory/InventoryScreen';
import SkinsScreen from '@/components/screens/SkinsScreen';
import QuizScreen from '@/components/screens/QuizScreen';
import TasksScreen from '@/components/screens/TasksScreen';
import SettingsScreen from '@/components/settings/SettingsScreen';
import AdminPanel from '@/components/AdminPanel';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import Sidebar from '@/components/Sidebar';
import LoadingScreen from '@/components/LoadingScreen';
import SecurityMonitor from '@/components/security/SecurityMonitor';
import { Toaster } from '@/components/ui/toaster';
import { useWebViewDetection } from '@/hooks/useWebViewDetection';

export type Screen = 'main' | 'inventory' | 'skins' | 'quiz' | 'tasks' | 'settings' | 'admin';

const MainApp: React.FC = () => {
  const { user, isLoading, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = React.useState<Screen>('main');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isWebView = useWebViewDetection();

  useEffect(() => {
    if (isWebView) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      // @ts-ignore - webkit specific property
      document.body.style.webkitTouchCallout = 'none';
    }
  }, [isWebView]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  const handleCoinsUpdate = (newCoins: number) => {
    console.log('Coins updated:', newCoins);
  };

  const currentUser = {
    id: user.id,
    username: user.username || 'User',
    coins: user.coins || 0,
    isPremium: user.isPremium || false,
    avatar_url: user.avatar_url,
    language_code: user.language_code || 'ru',
    quiz_lives: user.quiz_lives || 3,
    quiz_streak: user.quiz_streak || 0
  };

  const sidebarUser = {
    username: user.username || 'User',
    coins: user.coins || 0,
    isPremium: user.isPremium || false,
    isAdmin: user.isAdmin || false,
    avatar_url: user.avatar_url,
    language_code: user.language_code || 'ru'
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'inventory':
        return <InventoryScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      case 'skins':
        return <SkinsScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      case 'quiz':
        return <QuizScreen 
          currentUser={currentUser} 
          onCoinsUpdate={handleCoinsUpdate}
          onBack={() => setCurrentScreen('main')}
          onLivesUpdate={() => {}}
          onStreakUpdate={() => {}}
        />;
      case 'tasks':
        return <TasksScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      case 'settings':
        return <SettingsScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      case 'admin':
        return user.isAdmin ? <AdminPanel /> : <MainScreen 
          currentUser={currentUser} 
          onCoinsUpdate={handleCoinsUpdate}
          onScreenChange={setCurrentScreen}
        />;
      default:
        return <MainScreen 
          currentUser={currentUser} 
          onCoinsUpdate={handleCoinsUpdate}
          onScreenChange={setCurrentScreen}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <SecurityMonitor />
      
      <Header 
        currentUser={{
          username: user.username || 'User',
          coins: user.coins || 0,
          isPremium: user.isPremium || false,
          avatar_url: user.avatar_url,
          language_code: user.language_code || 'ru'
        }}
        onMenuClick={() => setSidebarOpen(true)}
      />
      
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={sidebarUser}
        onScreenChange={(screen: string) => setCurrentScreen(screen as Screen)}
        onSignOut={signOut}
      />
      
      <main className="pb-20 pt-16">
        {renderScreen()}
      </main>
      
      <BottomNavigation 
        currentScreen={currentScreen}
        onScreenChange={(screen: string) => setCurrentScreen(screen as Screen)}
      />
      
      <Toaster />
    </div>
  );
};

export default MainApp;
