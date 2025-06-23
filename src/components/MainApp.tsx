
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import WelcomeScreen from "@/components/WelcomeScreen";
import SkinsScreen from "@/components/SkinsScreen";
import BannerCarousel from "@/components/BannerCarousel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";

export type Screen = 'welcome' | 'skins' | 'tasks' | 'quiz' | 'inventory' | 'settings' | 'admin';

const MainApp = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();

  // Используем хук для получения данных пользователя
  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();

  // Инициализация аутентификации
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (mounted) {
            setAuthUser(null);
            setCurrentScreen('welcome');
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ User authenticated:', session.user.id);
          setAuthUser(session.user);
          setCurrentScreen('skins');
        } else {
          console.log('❌ No active session');
          if (mounted) {
            setAuthUser(null);
            setCurrentScreen('welcome');
          }
        }
      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        if (mounted) {
          setAuthUser(null);
          setCurrentScreen('welcome');
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    initializeAuth();

    // Подписываемся на изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event, session?.user?.id);

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setAuthUser(session.user);
            setCurrentScreen('skins');
            toast({
              title: "Добро пожаловать!",
              description: "Вы успешно вошли в аккаунт",
            });
          } else if (event === 'SIGNED_OUT') {
            setAuthUser(null);
            setCurrentScreen('welcome');
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setAuthUser(session.user);
          }
        } catch (error) {
          console.error('💥 Auth state change error:', error);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  // Обработка ошибок пользователя
  useEffect(() => {
    if (userError && authUser) {
      console.error('❌ User data error:', userError);
      if (userError.message.includes('User not found')) {
        // Пользователь не найден в базе, возможно, нужно создать профиль
        toast({
          title: "Ошибка профиля",
          description: "Пожалуйста, перезайдите в аккаунт",
          variant: "destructive",
        });
      }
    }
  }, [userError, authUser, toast]);

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        toast({
          title: "Ошибка выхода",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "До свидания!",
          description: "Вы успешно вышли из аккаунта",
        });
      }
    } catch (error) {
      console.error('💥 Sign out error:', error);
    }
  };

  const handleCoinsUpdate = (newCoins: number) => {
    // Force refetch of user data when coins are updated
    window.location.reload();
  };

  // Показываем загрузку пока инициализируется аутентификация
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Показываем экран входа если пользователь не аутентифицирован
  if (!authUser) {
    return <WelcomeScreen />;
  }

  // Ждем загрузки данных пользователя
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  // Если есть ошибка загрузки пользователя, показываем экран входа
  if (userError || !currentUser) {
    return <WelcomeScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'skins':
        return <SkinsScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
      default:
        return <SkinsScreen currentUser={currentUser} onCoinsUpdate={handleCoinsUpdate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Simple header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">FastMarket</h1>
          <div className="flex items-center space-x-4">
            <div className="text-yellow-400 font-bold">
              💰 {currentUser.coins} монет
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white text-sm"
            >
              Выход
            </button>
          </div>
        </div>
      </div>

      <main className="pt-4">
        <div className="container mx-auto px-4 py-6">
          {currentScreen === 'skins' && (
            <BannerCarousel onBannerAction={setCurrentScreen} />
          )}
          {renderScreen()}
        </div>
      </main>
    </div>
  );
};

export default MainApp;
