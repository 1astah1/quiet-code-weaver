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
    },
  },
});

const MainApp = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");

  useEffect(() => {
    console.log('🚀 [AUTH] Initializing authentication');

    // Простая инициализация аутентификации
    const initAuth = async () => {
      try {
        // Проверяем текущую сессию
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } catch (error) {
        console.error('❌ [AUTH] Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Слушаем изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AUTH] State change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (authId: string) => {
    try {
      console.log('👤 [USER] Fetching user data for:', authId);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error && error.code === 'PGRST116') { // Not found
        // Попробуем создать пользователя на основе данных из Supabase
        console.warn('⚠️ [USER] User not found, creating new user...');
        const { data: { user: supaUser } } = await supabase.auth.getUser();
        if (supaUser) {
          const { email, id } = supaUser;
          const username = email ? email.split('@')[0] : `user_${id.slice(0, 6)}`;
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              auth_id: id,
              username,
              email,
              coins: 0,
              is_admin: false,
              premium_until: null,
              language_code: 'ru',
            });
          if (insertError) {
            console.error('❌ [USER] Failed to create user:', insertError);
            setLoading(false);
            return;
          }
          // После создания — повторно получить пользователя
          await fetchUserData(id);
          return;
        } else {
          console.error('❌ [USER] No supabase user found for creation');
          setLoading(false);
          return;
        }
      } else if (error) {
        console.error('❌ [USER] Error:', error);
        setLoading(false);
        return;
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
        
        console.log('✅ [USER] User loaded:', appUser.username);
        setUser(appUser);
      } else {
        // Если по какой-то причине userData нет — сбросить загрузку
        setLoading(false);
      }
    } catch (error) {
      console.error('💥 [USER] Fetch error:', error);
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authUser: any) => {
    console.log('👍 [AUTH] Success callback triggered');
    // Состояние будет обновлено через onAuthStateChange
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

  if (loading) {
    return <LoadingScreen />;
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
