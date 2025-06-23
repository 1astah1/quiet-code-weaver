
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
import { useImagePreloader } from '@/hooks/useImagePreloader';

export type Screen = 'main' | 'inventory' | 'skins' | 'quiz' | 'tasks' | 'settings' | 'admin';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = React.useState<Screen>('main');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isWebView = useWebViewDetection();
  
  useImagePreloader();

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
    return <AuthScreen />;
  }

  const renderScreen = () => {
    const currentUser = {
      id: user.id,
      username: user.username || 'User',
      coins: user.coins || 0,
      isPremium: user.isPremium || false,
      avatar_url: user.avatar_url,
      language_code: user.language_code
    };

    const handleCoinsUpdate = (newCoins: number) => {
      // This would typically update the user context
      console.log('Coins updated:', newCoins);
    };

    switch (currentScreen) {
      case 'inventory':
        return <InventoryScreen />;
      case 'skins':
        return <SkinsScreen />;
      case 'quiz':
        return <QuizScreen />;
      case 'tasks':
        return <TasksScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      case 'settings':
        return <SettingsScreen />;
      case 'admin':
        return user.isAdmin ? <AdminPanel /> : <MainScreen />;
      default:
        return <MainScreen />;
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
          language_code: user.language_code
        }}
        onMenuClick={() => setSidebarOpen(true)}
      />
      
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
      />
      
      <main className="pb-20 pt-16">
        {renderScreen()}
      </main>
      
      <BottomNavigation 
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
      />
      
      <Toaster />
    </div>
  );
};

export default MainApp;
