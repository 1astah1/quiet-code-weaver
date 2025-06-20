
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
    console.log('Initializing auth...');
    
    let mounted = true;

    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('Found session for user:', session.user.id);
          await loadUserData(session.user);
        } else {
          console.log('No session found');
          if (mounted) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const loadUserData = async (authUser: User) => {
      try {
        console.log('Loading user data for:', authUser.id);
        
        // Получаем данные пользователя из нашей таблицы
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          // Если пользователя нет в таблице, создаем его
          if (error.code === 'PGRST116') {
            console.log('User not found in database, creating...');
            await createUserProfile(authUser);
            return;
          }
          throw error;
        }

        if (userData && mounted) {
          const user: AuthUser = {
            id: userData.id,
            username: userData.username || 'User',
            email: userData.email || authUser.email || '',
            coins: userData.coins || 0,
            isPremium: userData.premium_until ? new Date(userData.premium_until) > new Date() : false,
            isAdmin: userData.is_admin || false,
            referralCode: userData.referral_code,
            avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture
          };

          console.log('User loaded successfully:', user);
          setUser(user);
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const createUserProfile = async (authUser: User) => {
      try {
        console.log('Creating user profile for:', authUser.id);
        
        const newUserData = {
          id: authUser.id,
          username: authUser.user_metadata?.full_name || 
                   authUser.user_metadata?.name || 
                   authUser.email?.split('@')[0] || 
                   'User',
          email: authUser.email || '',
          coins: 1000,
          is_admin: false,
          referral_code: null
        };

        const { data, error } = await supabase
          .from('users')
          .insert(newUserData)
          .select()
          .single();

        if (error) {
          console.error('Error creating user:', error);
          throw error;
        }

        if (data && mounted) {
          const user: AuthUser = {
            id: data.id,
            username: data.username,
            email: data.email || '',
            coins: data.coins || 1000,
            isPremium: false,
            isAdmin: data.is_admin || false,
            referralCode: data.referral_code,
            avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture
          };

          console.log('User profile created:', user);
          setUser(user);
          setIsAuthenticated(true);
          setIsLoading(false);

          toast({
            title: "Добро пожаловать!",
            description: `Вы получили 1000 стартовых монет!`,
          });
        }
      } catch (error) {
        console.error('Error creating user profile:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Настраиваем слушатель изменений авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.id);
          await loadUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed');
          // При обновлении токена не перезагружаем данные пользователя
        }
      }
    );

    // Получаем начальную сессию
    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось выйти из системы",
          variant: "destructive",
        });
      } else {
        console.log('Successfully signed out');
        setUser(null);
        setIsAuthenticated(false);
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
