
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "./LoadingScreen";
import AuthScreen from "./auth/AuthScreen";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import MainScreen from "./screens/MainScreen";
import SkinsScreen from "./screens/SkinsScreen";
import SettingsScreen from "./settings/SettingsScreen";
import InventoryScreen from "./inventory/InventoryScreen";
import TasksScreen from "./screens/TasksScreen";
import AdminPanel from "./AdminPanel";
import WatermelonGameScreen from "./game/WatermelonGameScreen";
import QuizScreen from "./quiz/QuizScreen";
import WebViewOptimizer from "./WebViewOptimizer";
import SecurityMonitor from "./security/SecurityMonitor";
import SecurityStatus from "./security/SecurityStatus";
import ReferralHandler from "./referral/ReferralHandler";

interface User {
  id: string;
  username: string;
  email?: string;
  coins: number;
  is_admin: boolean;
  isPremium: boolean;
  language_code?: string;
}

export type Screen = 
  | "main" 
  | "skins" 
  | "inventory" 
  | "settings" 
  | "tasks" 
  | "admin" 
  | "watermelon"
  | "quiz";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (renamed from cacheTime)
    },
  },
});

const MainApp = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.id) {
          console.log('✅ [AUTH] User signed in:', session.user.id);
          await fetchUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 [AUTH] User signed out');
          setUser(null);
        } else if (event === 'INITIAL_SESSION' && session?.user?.id) {
          console.log('🚀 [AUTH] Initial session detected');
          await fetchUser(session.user.id);
        }

        setLoading(false);
      }
    );

    // Fetch initial user data if already authenticated
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          console.log('🔥 [AUTH] Session exists, fetching user data');
          await fetchUser(session.user.id);
        } else {
          console.warn('👻 [AUTH] No user in session');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log('🧹 [AUTH] Removing auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async (userId: string) => {
    try {
      console.log('👤 [USER] Fetching user data for ID:', userId);
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();

      if (error) {
        console.error('❌ [USER] Error fetching user:', error);
        throw error;
      }

      if (user) {
        console.log('✅ [USER] User data fetched:', user);
        // Transform database user to app user interface
        const appUser: User = {
          id: user.id,
          username: user.username,
          email: user.email || undefined,
          coins: user.coins || 0,
          is_admin: user.is_admin || false,
          isPremium: user.premium_until ? new Date(user.premium_until) > new Date() : false,
          language_code: user.language_code || undefined,
        };
        setUser(appUser);
      } else {
        console.warn('⚠️ [USER] User not found in database, ID:', userId);
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (err) {
      console.error('🔥 [USER] Error during user fetch:', err);
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (userId: string) => {
    console.log('👍 [AUTH] Authentication successful, user ID:', userId);
    fetchUser(userId);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleMenuClick = () => {
    setCurrentScreen("settings");
  };

  const handleBackToMain = () => {
    setCurrentScreen("main");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-x-hidden">
        <WebViewOptimizer />
        <SecurityMonitor />
        <SecurityStatus />
        <ReferralHandler />
        
        {loading ? (
          <LoadingScreen />
        ) : !user ? (
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        ) : (
          <>
            <Header 
              currentUser={user} 
              onMenuClick={handleMenuClick}
            />
            <main className="pb-20">
              {currentScreen === "main" && (
                <MainScreen 
                  currentUser={user} 
                  onCoinsUpdate={(newCoins: number) => setUser({...user, coins: newCoins})}
                  onScreenChange={setCurrentScreen}
                />
              )}
              {currentScreen === "skins" && (
                <SkinsScreen 
                  currentUser={user} 
                  onCoinsUpdate={(newCoins: number) => setUser({...user, coins: newCoins})}
                />
              )}
              {currentScreen === "inventory" && (
                <InventoryScreen 
                  currentUser={user} 
                  onCoinsUpdate={(newCoins: number) => setUser({...user, coins: newCoins})}
                />
              )}
              {currentScreen === "settings" && (
                <SettingsScreen 
                  currentUser={user} 
                  onUserUpdate={setUser}
                />
              )}
              {currentScreen === "tasks" && (
                <TasksScreen 
                  currentUser={user} 
                  onCoinsUpdate={(newCoins: number) => setUser({...user, coins: newCoins})}
                />
              )}
              {currentScreen === "admin" && user.is_admin && (
                <AdminPanel />
              )}
              {currentScreen === "watermelon" && (
                <WatermelonGameScreen 
                  currentUser={user}
                  onCoinsUpdate={(newCoins: number) => setUser({...user, coins: newCoins})}
                  onBack={handleBackToMain}
                />
              )}
              {currentScreen === "quiz" && (
                <QuizScreen 
                  currentUser={user}
                  onCoinsUpdate={(newCoins: number) => setUser({...user, coins: newCoins})}
                />
              )}
            </main>
            <BottomNavigation 
              currentScreen={currentScreen} 
              onScreenChange={setCurrentScreen}
              isAdmin={user.is_admin || false}
            />
          </>
        )}
        <Toaster />
      </div>
    </QueryClientProvider>
  );
};

export default MainApp;
