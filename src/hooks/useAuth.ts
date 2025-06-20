
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
    console.log('useAuth: Starting initialization');
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log('useAuth: Getting session...');
        
        // Получаем текущую сессию
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('useAuth: Session error:', sessionError);
          if (mounted) {
            setIsLoading(false);
            setIsAuthenticated(false);
            setUser(null);
          }
          return;
        }

        console.log('useAuth: Session result:', !!session);

        if (session?.user && mounted) {
          console.log('useAuth: User found, loading profile...');
          await loadUserProfile(session.user);
        } else {
          console.log('useAuth: No session found');
          if (mounted) {
            setIsLoading(false);
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('useAuth: Initialize error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };

    const loadUserProfile = async (authUser: User) => {
      try {
        console.log('useAuth: Loading profile for user:', authUser.id);
        
        // Получаем данные пользователя
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('useAuth: Profile load error:', error);
          
          // Если пользователя нет в базе, создаем его
          if (error.code === 'PGRST116') {
            console.log('useAuth: Creating user profile...');
            await createUserProfile(authUser);
            return;
          }
          
          throw error;
        }

        if (userData && mounted) {
          const userProfile: AuthUser = {
            id: userData.id,
            username: userData.username || 'User',
            email: userData.email || authUser.email || '',
            coins: userData.coins || 0,
            isPremium: userData.premium_until ? new Date(userData.premium_until) > new Date() : false,
            isAdmin: userData.is_admin || false,
            referralCode: userData.referral_code,
            avatar_url: authUser.user_metadata?.avatar_url
          };

          console.log('useAuth: Profile loaded successfully:', userProfile);
          setUser(userProfile);
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('useAuth: Load profile error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };

    const createUserProfile = async (authUser: User) => {
      try {
        console.log('useAuth: Creating profile for user:', authUser.id);
        
        const newUser = {
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
          .insert(newUser)
          .select()
          .single();

        if (error) throw error;

        if (data && mounted) {
          const userProfile: AuthUser = {
            id: data.id,
            username: data.username,
            email: data.email || '',
            coins: data.coins || 1000,
            isPremium: false,
            isAdmin: data.is_admin || false,
            referralCode: data.referral_code,
            avatar_url: authUser.user_metadata?.avatar_url
          };

          console.log('useAuth: Profile created successfully:', userProfile);
          setUser(userProfile);
          setIsAuthenticated(true);
          setIsLoading(false);

          toast({
            title: "Добро пожаловать!",
            description: "Вы получили 1000 стартовых монет!",
          });
        }
      } catch (error) {
        console.error('useAuth: Create profile error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };

    // Настраиваем слушатель событий аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event, !!session);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('useAuth: User signed in');
          setIsLoading(true);
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('useAuth: User signed out');
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('useAuth: Token refreshed');
          // При обновлении токена не перезагружаем профиль
        }
      }
    );

    // Инициализируем аутентификацию
    initializeAuth();

    return () => {
      console.log('useAuth: Cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signOut = async () => {
    try {
      console.log('useAuth: Signing out...');
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('useAuth: Sign out error:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось выйти из системы",
          variant: "destructive",
        });
      } else {
        console.log('useAuth: Successfully signed out');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('useAuth: Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserCoins = (newCoins: number) => {
    if (user) {
      setUser({ ...user, coins: newCoins });
    }
  };

  console.log('useAuth: Current state - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', !!user);

  return {
    user,
    isLoading,
    isAuthenticated,
    signOut,
    updateUserCoins
  };
};
