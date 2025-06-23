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
  const { user, isLoading, updateUserCoins } = useAuth();
  const [currentScreen, setCurrentScreen] = React.useState<Screen>('main');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isWebView = useWebViewDetection();
  
  useImagePreloader([]);

  useEffect(() => {
    if (isWebView) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      // @ts-ignore - webkitTouchCallout is a valid property for iOS
      document.body.style.webkitTouchCallout = 'none';
    }
  }, [isWebView]);

  const handleLoadingTimeout = () => {
    console.error('🚨 Loading timeout reached - forcing reload');
    window.location.reload();
  };

  if (isLoading) {
    return <LoadingScreen onTimeout={handleLoadingTimeout} />;
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  const renderScreen = () => {
    const commonProps = {
      currentUser: {
        id: user.id,
        username: user.username,
        coins: user.coins,
        referralCode: user.referralCode
      },
      onCoinsUpdate: updateUserCoins
    };

    const quizUserProps = {
      currentUser: {
        id: user.id,
        username: user.username,
        coins: user.coins,
        quiz_lives: user.quiz_lives,
        quiz_streak: user.quiz_streak
      },
      onCoinsUpdate: updateUserCoins
    };

    switch (currentScreen) {
      case 'inventory':
        return <InventoryScreen />;
      case 'skins':
        return <SkinsScreen {...commonProps} />;
      case 'quiz':
        return <QuizScreen 
          {...quizUserProps} 
          onBack={() => setCurrentScreen('main')}
          onLivesUpdate={() => {}}
          onStreakUpdate={() => {}}
        />;
      case 'tasks':
        return <TasksScreen {...commonProps} />;
      case 'settings':
        return <SettingsScreen {...commonProps} />;
      case 'admin':
        return user.isAdmin ? <AdminPanel /> : <MainScreen {...commonProps} onScreenChange={handleScreenChange} />;
      default:
        return <MainScreen {...commonProps} onScreenChange={handleScreenChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <SecurityMonitor />
      
      <Header 
        onMenuClick={() => setSidebarOpen(true)}
        currentScreen={currentScreen}
      />
      
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentScreen={currentScreen}
        onScreenChange={handleScreenChange}
      />
      
      <main className="pb-20 pt-16">
        {renderScreen()}
      </main>
      
      <BottomNavigation 
        currentScreen={currentScreen}
        onScreenChange={handleScreenChange}
      />
      
      <Toaster />
    </div>
  );
};

export default MainApp;
