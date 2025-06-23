
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
        
        // Если пользователь не найден, создаем новый профиль
        if (error.code === 'PGRST116') {
          console.log('📝 Creating new user profile...');
          await createUserProfile(authUser);
          return;
        }
        
        throw error;
      }

      if (data) {
        console.log('✅ User data loaded:', data.username);
        const userData: User = {
          id: data.id,
          username: data.username,
          email: data.email,
          coins: data.coins,
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
        
        // Логируем успешную аутентификацию
        await supabase.rpc('log_security_event', {
          p_user_id: data.id,
          p_action: 'auth_success',
          p_details: {
            username: data.username,
            timestamp: new Date().toISOString()
          },
          p_success: true
        });
      }
    } catch (error) {
      console.error('🚨 Error in fetchUserData:', error);
      
      // Логируем ошибку аутентификации
      await supabase.rpc('log_security_event', {
        p_user_id: null,
        p_action: 'auth_failure',
        p_details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          auth_user_id: authUser.id,
          timestamp: new Date().toISOString()
        },
        p_success: false
      });
      
      toast({
        title: "Ошибка загрузки профиля",
        description: "Не удалось загрузить данные пользователя. Попробуйте обновить страницу.",
        variant: "destructive",
      });
    } finally {
      // КРИТИЧЕСКИ ВАЖНО: всегда завершаем загрузку
      setIsLoading(false);
    }
  };

  const createUserProfile = async (authUser: any) => {
    try {
      console.log('🆕 Creating user profile for:', authUser.id);
      
      // Извлекаем имя пользователя из мета-данных
      const fullName = authUser.user_metadata?.full_name || 
                      authUser.user_metadata?.name || 
                      authUser.user_metadata?.preferred_username;
      
      const username = fullName || 
                      authUser.email?.split('@')[0] || 
                      'User' + Math.random().toString(36).substring(2, 8);

      // Генерируем уникальный реферальный код
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.id,
          username: username,
          email: authUser.email,
          coins: 1000, // Стартовый баланс
          referral_code: referralCode,
          language_code: 'ru',
          quiz_lives: 3,
          quiz_streak: 0,
          is_admin: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user profile:', error);
        
        // Если пользователь уже существует, пытаемся получить его данные
        if (error.code === '23505') { // unique_violation
          console.log('🔄 User already exists, fetching existing data...');
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();
          
          if (existingUser) {
            const userData: User = {
              id: existingUser.id,
              username: existingUser.username,
              email: existingUser.email,
              coins: existingUser.coins,
              isAdmin: existingUser.is_admin || false,
              quiz_lives: existingUser.quiz_lives || 3,
              quiz_streak: existingUser.quiz_streak || 0,
              referralCode: existingUser.referral_code,
              language_code: existingUser.language_code || 'ru',
              avatar_url: null,
              isPremium: existingUser.premium_until ? new Date(existingUser.premium_until) > new Date() : false,
              steam_trade_url: existingUser.steam_trade_url
            };
            setUser(userData);
            return;
          }
        }
        
        throw error;
      }

      console.log('✅ User profile created:', data.username);
      
      const userData: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        coins: data.coins,
        isAdmin: data.is_admin || false,
        quiz_lives: data.quiz_lives || 3,
        quiz_streak: data.quiz_streak || 0,
        referralCode: data.referral_code,
        language_code: data.language_code || 'ru',
        avatar_url: null,
        isPremium: false,
        steam_trade_url: null
      };
      setUser(userData);

      // Логируем создание нового пользователя
      await supabase.rpc('log_security_event', {
        p_user_id: data.id,
        p_action: 'user_created',
        p_details: {
          username: data.username,
          email: data.email,
          timestamp: new Date().toISOString()
        },
        p_success: true
      });

      toast({
        title: "Добро пожаловать!",
        description: `Ваш профиль создан. Начальный баланс: ${data.coins} монет`,
      });
    } catch (error) {
      console.error('🚨 Error creating user profile:', error);
      toast({
        title: "Ошибка создания профиля",
        description: "Не удалось создать профиль пользователя. Попробуйте войти еще раз.",
        variant: "destructive",
      });
    } finally {
      // КРИТИЧЕСКИ ВАЖНО: всегда завершаем загрузку
      setIsLoading(false);
    }
  };

  const updateUserCoins = async (newCoins: number) => {
    if (!user) return;

    try {
      console.log('💰 Updating user coins:', user.coins, '->', newCoins);
      
      setUser(prev => prev ? { ...prev, coins: newCoins } : null);
      
      // Логируем изменение монет
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_action: 'coins_updated',
        p_details: {
          old_balance: user.coins,
          new_balance: newCoins,
          change: newCoins - user.coins,
          timestamp: new Date().toISOString()
        },
        p_success: true
      });
    } catch (error) {
      console.error('❌ Error updating coin display:', error);
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        // Логируем выход
        await supabase.rpc('log_security_event', {
          p_user_id: user.id,
          p_action: 'sign_out',
          p_details: {
            timestamp: new Date().toISOString()
          },
          p_success: true
        });
      }

      console.log('👋 Signing out user');
      
      // Очищаем состояние аутентификации
      cleanupAuthState();
      
      // Выходим глобально
      await supabase.auth.signOut({ scope: 'global' });
      
      setUser(null);
      
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });
      
      // Принудительно обновляем страницу для полной очистки состояния
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error signing out:', error);
      toast({
        title: "Ошибка выхода",
        description: "Произошла ошибка при выходе из системы",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('🔄 Auth hook initialized');
    let mounted = true;
    
    // Устанавливаем слушатель изменений состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.id);
          setIsLoading(true);
          // Небольшая задержка для предотвращения deadlock'ов
          setTimeout(() => {
            if (mounted) {
              fetchUserData(session.user);
            }
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed for:', session.user.id);
        }
      }
    );

    // Проверяем существующую сессию
    const getSession = async () => {
      try {
        console.log('🔍 Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('🔑 Existing session found for:', session.user.id);
          await fetchUserData(session.user);
        } else {
          console.log('🚫 No existing session found');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('🚨 Error getting session:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getSession();

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      mounted = false;
      subscription.unsubscribe();
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
        setIsLoading(true);
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            fetchUserData(data.user);
          } else {
            setIsLoading(false);
          }
        });
      }
    }
  };
};
