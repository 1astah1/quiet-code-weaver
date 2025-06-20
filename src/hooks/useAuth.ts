
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

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Проверяем текущую сессию
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setIsLoading(false);
            setIsAuthenticated(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('Found existing session, handling user sign in');
          await handleUserSignIn(session.user);
        } else if (mounted) {
          console.log('No existing session found');
          setIsLoading(false);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
        }
      }
    };

    // Слушаем изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, processing...');
          await handleUserSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          handleUserSignOut();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed, updating user data');
          await handleUserSignIn(session.user);
        }
      }
    );

    // Инициализируем аутентификацию после установки слушателя
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUserSignIn = async (authUser: User) => {
    try {
      console.log('Handling user sign in for:', authUser.id);
      
      // Проверяем существование пользователя в базе данных
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching user:', fetchError);
        setIsLoading(false);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные пользователя",
          variant: "destructive",
        });
        return;
      }

      let userData: AuthUser;

      if (!existingUser) {
        console.log('Creating new user in database');
        
        // Получаем имя пользователя из метаданных Google
        const displayName = authUser.user_metadata?.full_name || 
                           authUser.user_metadata?.name || 
                           authUser.user_metadata?.display_name ||
                           authUser.email?.split('@')[0] || 
                           'User';

        const newUser = {
          id: authUser.id,
          username: displayName,
          email: authUser.email || '',
          coins: 1000,
          is_admin: false,
          referral_code: null,
          created_at: new Date().toISOString()
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          setIsLoading(false);
          toast({
            title: "Ошибка",
            description: "Не удалось создать профиль пользователя",
            variant: "destructive",
          });
          return;
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
        console.log('Using existing user data');
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

      console.log('Setting user data and updating state');
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);

      console.log('User signed in successfully:', userData.username);
    } catch (error) {
      console.error('Error handling user sign in:', error);
      setIsLoading(false);
      toast({
        title: "Ошибка авторизации",
        description: "Не удалось войти в систему",
        variant: "destructive",
      });
    }
  };

  const handleUserSignOut = () => {
    console.log('Handling user sign out');
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось выйти из системы",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
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
