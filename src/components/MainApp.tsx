
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
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    console.log('🚀 [AUTH] Starting authentication initialization');

    // Set a more reasonable timeout
    loadingTimeout = setTimeout(() => {
      if (mounted && !authInitialized) {
        console.warn('⚠️ [AUTH] Loading timeout reached');
        setLoading(false);
        setAuthError('Таймаут загрузки. Пожалуйста, обновите страницу.');
      }
    }, 15000); // 15 seconds timeout

    const fetchUser = async (userId: string): Promise<boolean> => {
      try {
        console.log('👤 [USER] Fetching user data for ID:', userId);
        
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', userId)
          .single();

        if (!mounted) return false;

        if (error) {
          console.error('❌ [USER] Error fetching user:', error);
          
          // If user not found and we haven't exceeded retry limit
          if (error.code === 'PGRST116' && retryCount < MAX_RETRIES) {
            console.log('🔄 [USER] User not found, retrying...', retryCount + 1);
            retryCount++;
            // Wait a bit longer for user creation trigger
            setTimeout(() => {
              if (mounted) fetchUser(userId);
            }, 3000);
            return false;
          }
          
          throw error;
        }

        if (user) {
          console.log('✅ [USER] User data fetched successfully');
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
          return true;
        }

        return false;
      } catch (err) {
        console.error('🔥 [USER] Error during user fetch:', err);
        if (mounted) {
          setAuthError('Ошибка загрузки данных пользователя');
        }
        return false;
      }
    };

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 [AUTH] Auth state change:', event, session?.user?.id);
        
        try {
          if (event === 'SIGNED_IN' && session?.user?.id) {
            console.log('✅ [AUTH] User signed in');
            const success = await fetchUser(session.user.id);
            if (success && mounted) {
              setAuthInitialized(true);
              setLoading(false);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 [AUTH] User signed out');
            if (mounted) {
              setUser(null);
              setAuthError(null);
              setAuthInitialized(true);
              setLoading(false);
            }
          } else if (event === 'INITIAL_SESSION') {
            if (session?.user?.id) {
              console.log('🔄 [AUTH] Initial session with user');
              const success = await fetchUser(session.user.id);
              if (mounted) {
                setAuthInitialized(true);
                setLoading(false);
              }
            } else {
              console.log('👻 [AUTH] No initial session');
              if (mounted) {
                setAuthInitialized(true);
                setLoading(false);
              }
            }
          }
        } catch (error) {
          console.error('❌ [AUTH] Error in auth state change:', error);
          if (mounted) {
            setAuthError('Ошибка аутентификации');
            setAuthInitialized(true);
            setLoading(false);
          }
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 [AUTH] Getting initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('❌ [AUTH] Error getting session:', error);
          setAuthError('Ошибка получения сессии');
          setAuthInitialized(true);
          setLoading(false);
          return;
        }

        // The onAuthStateChange will handle the session
        if (!session) {
          console.log('👻 [AUTH] No session found');
          setAuthInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 [AUTH] Error getting initial session:', error);
        if (mounted) {
          setAuthError('Ошибка инициализации аутентификации');
          setAuthInitialized(true);
          setLoading(false);
        }
      }
    };

    // Start the initialization process
    getInitialSession();

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      console.log('🧹 [AUTH] Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = (userId: string) => {
    console.log('👍 [AUTH] Authentication successful, user ID:', userId);
    // The auth state change listener will handle fetching user data
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
