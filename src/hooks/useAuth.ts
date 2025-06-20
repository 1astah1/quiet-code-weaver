
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  coins: number;
  isPremium: boolean;
  isAdmin: boolean;
  referralCode: string | null;
  avatar_url?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Добавляем небольшую задержку для стабилизации
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          if (mounted) {
            setIsLoading(false);
            setIsAuthenticated(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Found existing session for user:', session.user.id);
          await handleUserSignIn(session.user);
        } else if (mounted) {
          console.log('ℹ️ No existing session found');
          setIsLoading(false);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
        }
      }
    };

    // Устанавливаем слушатель изменений состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in event');
          // Небольшая задержка для предотвращения конфликтов
          setTimeout(() => {
            if (mounted) {
              handleUserSignIn(session.user);
            }
          }, 200);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out event');
          handleUserSignOut();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed event');
          // Обновляем данные пользователя при обновлении токена
          setTimeout(() => {
            if (mounted) {
              handleUserSignIn(session.user);
            }
          }, 100);
        }
      }
    );

    // Инициализируем аутентификацию с небольшой задержкой
    initTimeout = setTimeout(() => {
      if (mounted) {
        initializeAuth();
      }
    }, 100);

    return () => {
      mounted = false;
      if (initTimeout) clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleUserSignIn = async (authUser: User) => {
    try {
      console.log('🔄 Processing user sign in for:', authUser.id);
      setIsLoading(true);
      
      // Проверяем существование пользователя в новой структуре БД
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching user:', fetchError);
        throw fetchError;
      }

      let userData: AuthUser;

      if (!existingUser) {
        console.log('👤 Creating new user profile in database');
        
        // Получаем имя пользователя из метаданных
        const displayName = authUser.user_metadata?.full_name || 
                           authUser.user_metadata?.name || 
                           authUser.user_metadata?.display_name ||
                           authUser.email?.split('@')[0] || 
                           'User';

        const newUserData = {
          auth_id: authUser.id,
          username: displayName,
          email: authUser.email || '',
          coins: 1000,
          is_admin: false,
          referral_code: null,
          created_at: new Date().toISOString()
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUserData)
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating user:', createError);
          throw createError;
        }

        userData = {
          id: createdUser.id,
          username: createdUser.username,
          email: createdUser.email || '',
          coins: createdUser.coins || 1000,
          isPremium: createdUser.premium_until ? new Date(createdUser.premium_until) > new Date() : false,
          isAdmin: createdUser.is_admin || false,
          referralCode: createdUser.referral_code,
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture
        };

        toast({
          title: "Добро пожаловать!",
          description: "Вы получили 1000 стартовых монет!",
        });
      } else {
        console.log('👤 Using existing user profile');
        userData = {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email || '',
          coins: existingUser.coins || 0,
          isPremium: existingUser.premium_until ? new Date(existingUser.premium_until) > new Date() : false,
          isAdmin: existingUser.is_admin || false,
          referralCode: existingUser.referral_code,
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture
        };
      }

      console.log('✅ Setting user data:', userData.username);
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);

    } catch (error) {
      console.error('❌ Error in handleUserSignIn:', error);
      setIsLoading(false);
      setIsAuthenticated(false);
      toast({
        title: "Ошибка авторизации",
        description: "Не удалось войти в систему. Попробуйте еще раз.",
        variant: "destructive",
      });
    }
  };

  const handleUserSignOut = () => {
    console.log('👋 Handling user sign out');
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const signOut = async () => {
    try {
      console.log('👋 Signing out user...');
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось выйти из системы",
          variant: "destructive",
        });
      } else {
        console.log('✅ Successfully signed out');
      }
    } catch (error) {
      console.error('❌ Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserCoins = (newCoins: number) => {
    if (user) {
      setUser({ ...user, coins: newCoins });
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    signOut,
    updateUserCoins
  };
};
