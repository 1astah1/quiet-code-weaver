
import React, { useState, useEffect, useRef } from 'react';
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
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'code' in error) {
          const code = (error as any).code;
          if (code === 'PGRST301' || code === 'PGRST116') {
            return false;
          }
        }
        return failureCount < 2;
      }
    },
  },
});

const MainApp = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  
  // Используем ref для предотвращения множественных вызовов fetchUserData
  const fetchingUserRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Очищаем таймеры при размонтировании
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('🚀 [AUTH] Initializing authentication');
    
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (sessionError) {
          console.warn('⚠️ [AUTH] Session error (recoverable):', sessionError.message);
        }
        
        if (session?.user) {
          console.log('✅ [AUTH] Found existing session:', session.user.id);
          await fetchUserData(session.user.id);
        } else {
          console.log('ℹ️ [AUTH] No existing session');
        }
        
        setAuthReady(true);
      } catch (error: any) {
        console.error('❌ [AUTH] Init error:', error);
        if (isMounted) {
          setError('Ошибка инициализации. Попробуйте обновить страницу.');
          setAuthReady(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 [AUTH] State change:', event, session?.user?.id);
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ [AUTH] User signed in:', session.user.id);
            await fetchUserData(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 [AUTH] User signed out');
            setUser(null);
            setError(null);
            fetchingUserRef.current = false;
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 [AUTH] Token refreshed for:', session.user.id);
            // Не перезагружаем пользователя при обновлении токена если он уже есть
            if (!user) {
              await fetchUserData(session.user.id);
            }
          }
        } catch (error: any) {
          console.error('❌ [AUTH] State change error:', error);
          setError('Ошибка обработки авторизации');
        }
        
        setLoading(false);
      }
    );

    initAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [user]); // Добавляем user в зависимости

  const fetchUserData = async (authId: string, retryCount: number = 0) => {
    // Предотвращаем множественные одновременные вызовы
    if (fetchingUserRef.current) {
      console.log('🔄 [USER] Already fetching user data, skipping...');
      return;
    }

    fetchingUserRef.current = true;

    try {
      console.log('👤 [USER] Fetching user data for:', authId, `(attempt ${retryCount + 1})`);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error) {
        if (error.code === 'PGRST116' && retryCount < 2) {
          console.warn('⚠️ [USER] User not found, attempting to create...');
          await createUserProfile(authId);
          
          // Retry через короткую задержку
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          retryTimeoutRef.current = setTimeout(() => {
            fetchingUserRef.current = false;
            fetchUserData(authId, retryCount + 1);
          }, 1000);
          return;
        }
        throw error;
      }

      if (userData) {
        const appUser: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email || undefined,
          coins: userData.coins || 0,
          is_admin: userData.is_admin || false,
          isPremium: userData.premium_until ? new Date(userData.premium_until) > new Date() : false,
          language_code: userData.language_code || undefined,
        };
        
        console.log('✅ [USER] User loaded:', appUser.username, 'Balance:', appUser.coins);
        setUser(appUser);
        setError(null);
      }
    } catch (error: any) {
      console.error('💥 [USER] Fetch error:', error);
      
      if (retryCount < 2) {
        console.log('🔄 [USER] Retrying user fetch...');
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          fetchingUserRef.current = false;
          fetchUserData(authId, retryCount + 1);
        }, 2000 * (retryCount + 1));
      } else {
        setError('Не удалось загрузить данные пользователя');
      }
    } finally {
      fetchingUserRef.current = false;
    }
  };

  const createUserProfile = async (authId: string) => {
    try {
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      if (!supaUser) throw new Error('No user data from Supabase');

      const username = supaUser.email 
        ? supaUser.email.split('@')[0] 
        : `user_${authId.slice(0, 6)}`;

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          auth_id: authId,
          username,
          email: supaUser.email,
          coins: 1000,
          is_admin: false,
          premium_until: null,
          language_code: 'ru',
        });

      if (insertError) {
        throw insertError;
      }

      console.log('✅ [USER] Created new user profile:', username);
    } catch (error: any) {
      console.error('❌ [USER] Failed to create user profile:', error);
      throw error;
    }
  };

  const handleAuthSuccess = (authUser: any) => {
    console.log('👍 [AUTH] Success callback triggered');
  };

  const handleUserUpdate = (updatedUser: User) => {
    console.log('🔄 [USER] Updating user data:', updatedUser.username, 'Balance:', updatedUser.coins);
    setUser(updatedUser);
  };

  const handleMenuClick = () => {
    setCurrentScreen("settings");
  };

  const handleBackToMain = () => {
    setCurrentScreen("main");
  };

  // Глобальный фикс для NotFoundError при повторном removeChild (ошибка порталов)
  React.useEffect(() => {
    const origRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function<T extends Node>(child: T): T {
      try {
        return origRemoveChild.call(this, child) as T;
      } catch (e: any) {
        if (e && typeof e === 'object' && e.name === 'NotFoundError') {
          // Игнорируем ошибку двойного удаления
          return child;
        }
        throw e;
      }
    };
    return () => {
      Node.prototype.removeChild = origRemoveChild;
    };
  }, []);

  if (loading || !authReady) {
    return <LoadingScreen error={error ?? undefined} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-x-hidden">
        <WebViewOptimizer />
        
        {!user ? (
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
                  onCoinsUpdate={(newCoins: number) => {
                    console.log('💰 [BALANCE] Updating coins from', user.coins, 'to', newCoins);
                    setUser({...user, coins: newCoins});
                  }}
                  onScreenChange={setCurrentScreen}
                />
              )}
              {currentScreen === "skins" && (
                <SkinsScreen 
                  currentUser={user} 
                  onCoinsUpdate={(newCoins: number) => {
                    console.log('💰 [BALANCE] Updating coins from', user.coins, 'to', newCoins);
                    setUser({...user, coins: newCoins});
                  }}
                />
              )}
              {currentScreen === "inventory" && (
                <InventoryScreen 
                  currentUser={user} 
                  onCoinsUpdate={(newCoins: number) => {
                    console.log('💰 [BALANCE] Updating coins from', user.coins, 'to', newCoins);
                    setUser({...user, coins: newCoins});
                  }}
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
                  onCoinsUpdate={(newCoins: number) => {
                    console.log('💰 [BALANCE] Updating coins from', user.coins, 'to', newCoins);
                    setUser({...user, coins: newCoins});
                  }}
                />
              )}
              {currentScreen === "admin" && user.is_admin && (
                <AdminPanel />
              )}
              {currentScreen === "watermelon" && (
                <WatermelonGameScreen 
                  currentUser={user}
                  onCoinsUpdate={(newCoins: number) => {
                    console.log('💰 [BALANCE] Updating coins from', user.coins, 'to', newCoins);
                    setUser({...user, coins: newCoins});
                  }}
                  onBack={handleBackToMain}
                />
              )}
              {currentScreen === "quiz" && (
                <QuizScreen 
                  currentUser={user}
                  onCoinsUpdate={(newCoins: number) => {
                    console.log('💰 [BALANCE] Updating coins from', user.coins, 'to', newCoins);
                    setUser({...user, coins: newCoins});
                  }}
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
