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
import { clearAllCache } from '@/utils/clearCache';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 [AUTH] Initializing authentication');

    // Простая инициализация аутентификации
    const initAuth = async () => {
      try {
        // Проверяем текущую сессию
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError('Ошибка получения сессии: ' + sessionError.message);
        }
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } catch (error: any) {
        setError('Ошибка инициализации: ' + (error?.message || error));
        console.error('❌ [AUTH] Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Слушаем изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AUTH] State change:', event);
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            await fetchUserData(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        } catch (e: any) {
          setError('Ошибка при обработке события аутентификации: ' + (e?.message || e));
        }
        setLoading(false);
      }
    );

    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Автоматическая очистка кэша, если загрузка длится слишком долго
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('⏳ [AUTH] Loading too long, clearing cache...');
          clearAllCache();
          window.location.reload();
        }
      }, 5000); // 5 секунд
      return () => clearTimeout(timeout);
    }
  }, [loading]);

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
        const { data: { user: supaUser }, error: supaUserError } = await supabase.auth.getUser();
        if (supaUserError) {
          setError('Ошибка получения пользователя из Supabase: ' + supaUserError.message);
          setLoading(false);
          // Если не удалось получить пользователя из Supabase — выходим из сессии
          await supabase.auth.signOut();
          return;
        }
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
            setError('Ошибка создания пользователя: ' + insertError.message);
            console.error('❌ [USER] Failed to create user:', insertError);
            setLoading(false);
            // Если не удалось создать пользователя — выходим из сессии
            await supabase.auth.signOut();
            return;
          }
          // После создания — повторно получить пользователя
          await fetchUserData(id);
          return;
        } else {
          setError('Нет данных пользователя для создания профиля.');
          console.error('❌ [USER] No supabase user found for creation');
          setLoading(false);
          // Если нет данных пользователя — выходим из сессии
          await supabase.auth.signOut();
          return;
        }
      } else if (error) {
        setError('Ошибка запроса пользователя: ' + error.message);
        console.error('❌ [USER] Error:', error);
        setLoading(false);
        // Если ошибка при запросе пользователя — выходим из сессии
        await supabase.auth.signOut();
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
        setError('Пользователь не найден и не может быть создан.');
        setLoading(false);
        // Если не найден пользователь — выходим из сессии
        await supabase.auth.signOut();
      }
    } catch (error: any) {
      setError('Ошибка загрузки пользователя: ' + (error?.message || error));
      console.error('💥 [USER] Fetch error:', error);
      setLoading(false);
      // Если критическая ошибка — выходим из сессии
      await supabase.auth.signOut();
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
