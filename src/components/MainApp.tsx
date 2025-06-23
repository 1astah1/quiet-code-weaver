import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import LoadingScreen from "@/components/LoadingScreen";
import AuthScreen from "@/components/auth/AuthScreen";
import MainScreen from "@/components/screens/MainScreen";
import SkinsScreen from "@/components/screens/SkinsScreen";
import TasksScreenFixed from "@/components/screens/TasksScreenFixed";
import ImprovedQuizScreen from "@/components/enhanced/ImprovedQuizScreen";
import InventoryScreen from "@/components/inventory/InventoryScreen";
import SettingsScreen from "@/components/settings/SettingsScreen";
import AdminPanel from "@/components/AdminPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const MainApp = () => {
  const { user, isLoading, isAuthenticated, signOut, updateUserCoins } = useAuth();
  const [activeScreen, setActiveScreen] = useState('main');
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const handleNavigate = (section: string) => {
    console.log('🧭 Navigating to section:', section);
    setActiveScreen(section);
  };

  const renderActiveScreen = () => {
    if (showAdminPanel && user?.isAdmin) {
      return <AdminPanel onClose={() => setShowAdminPanel(false)} />;
    }

    switch (activeScreen) {
      case 'main':
        return (
          <MainScreen
            currentUser={user}
            onCoinsUpdate={updateUserCoins}
            onNavigate={handleNavigate}
          />
        );
      case 'skins':
        return (
          <SkinsScreen 
            currentUser={user} 
            onCoinsUpdate={updateUserCoins} 
          />
        );
      case 'tasks':
        return (
          <TasksScreenFixed 
            currentUser={user} 
            onCoinsUpdate={updateUserCoins} 
          />
        );
      case 'quiz':
        return (
          <ImprovedQuizScreen 
            currentUser={user} 
            onCoinsUpdate={updateUserCoins} 
          />
        );
      case 'inventory':
        return (
          <InventoryScreen 
            currentUser={user} 
            onCoinsUpdate={updateUserCoins} 
          />
        );
      case 'settings':
        return (
          <SettingsScreen 
            currentUser={user} 
            onSignOut={signOut}
            onAdminPanel={() => setShowAdminPanel(true)}
            onCoinsUpdate={updateUserCoins}
          />
        );
      default:
        return (
          <MainScreen
            currentUser={user}
            onCoinsUpdate={updateUserCoins}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header user={user} />
        {renderActiveScreen()}
        <BottomNavigation 
          activeScreen={activeScreen} 
          onScreenChange={setActiveScreen} 
        />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
};

export default MainApp;
