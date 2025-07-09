
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
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    // Set timeout to prevent infinite loading
    loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ [AUTH] Loading timeout reached, setting loading to false');
        setLoading(false);
        setAuthError('Authentication timeout. Please refresh the page.');
      }
    }, 10000); // 10 seconds timeout

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 [AUTH] Auth state change:', event, session?.user?.id);
        
        try {
          if (event === 'SIGNED_IN' && session?.user?.id) {
            console.log('✅ [AUTH] User signed in:', session.user.id);
            await fetchUser(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 [AUTH] User signed out');
            setUser(null);
            setAuthError(null);
          } else if (event === 'INITIAL_SESSION' && session?.user?.id) {
            console.log('🚀 [AUTH] Initial session detected');
            await fetchUser(session.user.id);
          } else if (event === 'INITIAL_SESSION' && !session) {
            console.log('👻 [AUTH] No initial session');
          }
        } catch (error) {
          console.error('❌ [AUTH] Error in auth state change:', error);
          setAuthError('Authentication error occurred');
        } finally {
          if (mounted) {
            setLoading(false);
            clearTimeout(loadingTimeout);
          }
        }
      }
    );

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('❌ [AUTH] Error getting session:', error);
          setAuthError('Failed to get session');
          setLoading(false);
          return;
        }

        if (session?.user?.id) {
          console.log('🔥 [AUTH] Session exists, fetching user data');
          await fetchUser(session.user.id);
        } else {
          console.warn('👻 [AUTH] No user in session');
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 [AUTH] Error getting initial session:', error);
        if (mounted) {
          setAuthError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
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
        
        // If user not found, try to create one
        if (error.code === 'PGRST116') {
          console.log('🔄 [USER] User not found, will be created by trigger');
          // Give the trigger some time to create the user
          setTimeout(() => fetchUser(userId), 2000);
          return;
        }
        
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
        setAuthError(null);
      } else {
        console.warn('⚠️ [USER] User data is null');
        setAuthError('User data not found');
      }
    } catch (err) {
      console.error('🔥 [USER] Error during user fetch:', err);
      setAuthError('Failed to load user data');
      
      // If we can't fetch user data, sign out to prevent stuck state
      await supabase.auth.signOut();
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

  // Show error screen if there's an auth error
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Ошибка загрузки</h2>
          <p className="text-gray-400 mb-6">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

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
                  onUserUpdate={handleUserUpdate}
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
