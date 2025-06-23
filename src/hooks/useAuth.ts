
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

  const fetchUserData = async (authUser: any): Promise<User | null> => {
    try {
      console.log('👤 Fetching user data for:', authUser.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching user data:', error);
        return null;
      }

      if (!data) {
        console.log('📝 User not found, creating new user...');
        return await createNewUser(authUser);
      }

      console.log('✅ User data loaded:', data.username);
      return mapUserData(data);
    } catch (error) {
      console.error('🚨 Error in fetchUserData:', error);
      return null;
    }
  };

  const createNewUser = async (authUser: any): Promise<User | null> => {
    try {
      const username = authUser.user_metadata?.full_name || 
                      authUser.user_metadata?.name || 
                      authUser.email?.split('@')[0] || 
                      `User${Date.now()}`;

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.id,
          username: username,
          email: authUser.email,
          coins: 1000,
          referral_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
          language_code: 'ru',
          quiz_lives: 3,
          quiz_streak: 0,
          is_admin: false
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        // Если пользователь уже существует, попробуем получить его
        if (createError.code === '23505') {
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();
          
          if (existingUser) {
            return mapUserData(existingUser);
          }
        }
        return null;
      }

      console.log('✅ New user created:', newUser.username);
      return mapUserData(newUser);
    } catch (error) {
      console.error('🚨 Error creating new user:', error);
      return null;
    }
  };

  const mapUserData = (data: any): User => {
    return {
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
      window.location.reload();
    } catch (error) {
      console.error('❌ Error signing out:', error);
      toast({
        title: "Ошибка выхода",
        description: "Произошла ошибка при выходе",
        variant: "destructive",
      });
    }
  };

  const refetchUser = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const userData = await fetchUserData(data.user);
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('🚨 Error refetching user:', error);
    }
  };

  useEffect(() => {
    console.log('🔄 Auth hook initialized');
    
    let mounted = true;
    
    const initAuth = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          console.log('🔑 Existing session found');
          const userData = await fetchUserData(session.user);
          if (userData && mounted) {
            setUser(userData);
          }
        } else {
          console.log('❌ No existing session');
        }
      } catch (error) {
        console.error('🚨 Error getting session:', error);
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization complete');
          setIsLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, !!session);
        
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.id);
          setIsLoading(true);
          const userData = await fetchUserData(session.user);
          if (userData && mounted) {
            setUser(userData);
          }
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    updateUserCoins,
    signOut,
    refetchUser
  };
};
