
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
          console.log('📝 User not found, creating new user...');
          
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              auth_id: authUser.id,
              username: authUser.user_metadata?.full_name || 
                       authUser.user_metadata?.name || 
                       authUser.email?.split('@')[0] || 
                       `User${authUser.id.slice(0, 8)}`,
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
            return null;
          }

          if (newUser) {
            console.log('✅ New user created:', newUser.username);
            const userData: User = {
              id: newUser.id,
              username: newUser.username || 'User',
              email: newUser.email,
              coins: newUser.coins || 1000,
              isAdmin: newUser.is_admin || false,
              quiz_lives: newUser.quiz_lives || 3,
              quiz_streak: newUser.quiz_streak || 0,
              referralCode: newUser.referral_code,
              language_code: newUser.language_code || 'ru',
              avatar_url: null,
              isPremium: newUser.premium_until ? new Date(newUser.premium_until) > new Date() : false,
              steam_trade_url: newUser.steam_trade_url
            };
            return userData;
          }
        }
        return null;
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
        return userData;
      }
    } catch (error) {
      console.error('🚨 Error in fetchUserData:', error);
    }
    return null;
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
    
    let mounted = true;
    
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          console.log('🔑 Existing session found');
          const userData = await fetchUserData(session.user);
          if (userData) {
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
          const userData = await fetchUserData(session.user);
          if (userData) {
            setUser(userData);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
        }
        
        if (mounted) {
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
    refetchUser: () => {
      if (user) {
        console.log('🔄 Refetching user data');
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            fetchUserData(data.user).then(userData => {
              if (userData) {
                setUser(userData);
              }
            });
          }
        });
      }
    }
  };
};
