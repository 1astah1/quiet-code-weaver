
import { useState, useEffect } from 'react';
import { supabase, cleanupAuthState } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string | null;
  coins: number;
  isAdmin: boolean;
  quiz_lives: number;
  quiz_streak: number;
  referralCode: string | null;
  language_code: string;
  avatar_url: string | null;
  isPremium: boolean;
  steam_trade_url: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserData = async (authUser: any) => {
    try {
      console.log('👤 Fetching user data for:', authUser.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (error) {
        console.error('❌ Error fetching user data:', error);
        
        if (error.code === 'PGRST116') {
          console.log('📝 User not found, creating...');
          // Даем время триггеру создать пользователя
          setTimeout(async () => {
            const { data: retryData, error: retryError } = await supabase
              .from('users')
              .select('*')
              .eq('auth_id', authUser.id)
              .single();
            
            if (!retryError && retryData) {
              const userData: User = {
                id: retryData.id,
                username: retryData.username || 'User',
                email: retryData.email,
                coins: retryData.coins || 0,
                isAdmin: retryData.is_admin || false,
                quiz_lives: retryData.quiz_lives || 3,
                quiz_streak: retryData.quiz_streak || 0,
                referralCode: retryData.referral_code,
                language_code: retryData.language_code || 'ru',
                avatar_url: null,
                isPremium: retryData.premium_until ? new Date(retryData.premium_until) > new Date() : false,
                steam_trade_url: retryData.steam_trade_url
              };
              setUser(userData);
            }
            setIsLoading(false);
          }, 2000);
          return;
        }
        
        setIsLoading(false);
        return;
      }

      if (data) {
        console.log('✅ User data loaded:', data.username);
        const userData: User = {
          id: data.id,
          username: data.username || 'User',
          email: data.email,
          coins: data.coins || 0,
          isAdmin: data.is_admin || false,
          quiz_lives: data.quiz_lives || 3,
          quiz_streak: data.quiz_streak || 0,
          referralCode: data.referral_code,
          language_code: data.language_code || 'ru',
          avatar_url: null,
          isPremium: data.premium_until ? new Date(data.premium_until) > new Date() : false,
          steam_trade_url: data.steam_trade_url
        };
        setUser(userData);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('🚨 Error in fetchUserData:', error);
      setIsLoading(false);
    }
  };

  const updateUserCoins = async (newCoins: number) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, coins: newCoins } : null);
  };

  const signOut = async () => {
    try {
      console.log('👋 Signing out user');
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      setUser(null);
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Error signing out:', error);
      toast({
        title: "Ошибка выхода",
        description: "Произошла ошибка при выходе",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('🔄 Auth hook initialized');
    
    // Принудительный таймаут для завершения загрузки
    const forceFinishLoading = setTimeout(() => {
      console.log('⏰ Force finishing loading');
      setIsLoading(false);
    }, 8000);
    
    const initAuth = async () => {
      try {
        // Проверяем существующую сессию
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('🔑 Existing session found');
          await fetchUserData(session.user);
        } else {
          console.log('❌ No existing session');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('🚨 Error getting session:', error);
        setIsLoading(false);
      }
    };

    // Устанавливаем слушатель изменений состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        clearTimeout(forceFinishLoading);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.id);
          await fetchUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    initAuth();

    return () => {
      subscription.unsubscribe();
      clearTimeout(forceFinishLoading);
    };
  }, []);

  return {
    user,
    isLoading,
    updateUserCoins,
    signOut,
    refetchUser: () => {
      if (user) {
        console.log('🔄 Refetching user data');
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            fetchUserData(data.user);
          }
        });
      }
    }
  };
};
