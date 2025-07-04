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
      cacheTime: 1000 * 60 * 10, // 10 minutes
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
        if (event === 'SIGNED_IN') {
          console.log('✅ [AUTH] User signed in:', session?.user.id);
          await fetchUser(session?.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 [AUTH] User signed out');
          setUser(null);
        } else if (event === 'INITIAL_SESSION') {
          console.log('🚀 [AUTH] Initial session detected');
          await fetchUser(session?.user.id);
        }

        setLoading(false);
      }
    );

    // Fetch initial user data if already authenticated
    if (supabase.auth.getSession()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          console.log('🔥 [AUTH] Session exists, fetching user data');
          fetchUser(session.user.id);
        } else {
          console.warn('👻 [AUTH] No user in session');
          setLoading(false);
        }
      });
    } else {
      console.log('💤 [AUTH] No session found');
      setLoading(false);
    }

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
        setUser(user);
      } else {
        console.warn('⚠️ [USER] User not found in database, ID:', userId);
        // Handle case where user doesn't exist in the database
        // You might want to sign them out or redirect them
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (err) {
      console.error('🔥 [USER] Error during user fetch:', err);
      // Handle error during user fetch
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
              onCoinsUpdate={setUser}
              currentScreen={currentScreen}
            />
            <main className="pb-20">
              {currentScreen === "main" && (
                <MainScreen 
                  currentUser={user} 
                  onCoinsUpdate={(newCoins) => setUser({...user, coins: newCoins})}
                  onScreenChange={setCurrentScreen}
                />
              )}
              {currentScreen === "skins" && (
                <SkinsScreen 
                  currentUser={user} 
                  onCoinsUpdate={(newCoins) => setUser({...user, coins: newCoins})}
                />
              )}
              {currentScreen === "inventory" && (
                <InventoryScreen 
                  currentUser={user} 
                  onCoinsUpdate={(newCoins) => setUser({...user, coins: newCoins})}
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
                  onCoinsUpdate={(newCoins) => setUser({...user, coins: newCoins})}
                />
              )}
              {currentScreen === "admin" && user.is_admin && (
                <AdminPanel />
              )}
              {currentScreen === "watermelon" && (
                <WatermelonGameScreen 
                  currentUser={user}
                  onCoinsUpdate={(newCoins) => setUser({...user, coins: newCoins})}
                />
              )}
              {currentScreen === "quiz" && (
                <QuizScreen 
                  currentUser={user}
                  onCoinsUpdate={(newCoins) => setUser({...user, coins: newCoins})}
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
