
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
        
        // If user not found, create a new profile
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
        
        // Log successful authentication
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
      
      // Log authentication failure
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
        description: "Не удалось загрузить данные пользователя",
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
      
      const username = authUser.user_metadata?.full_name || 
                      authUser.user_metadata?.name || 
                      authUser.email?.split('@')[0] || 
                      'User';

      const { data, error } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.id,
          username: username,
          email: authUser.email,
          coins: 1000,
          referral_code: generateReferralCode(),
          language_code: 'ru'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user profile:', error);
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

      // Log new user creation
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
        description: "Не удалось создать профиль пользователя",
        variant: "destructive",
      });
    } finally {
      // КРИТИЧЕСКИ ВАЖНО: всегда завершаем загрузку
      setIsLoading(false);
    }
  };

  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const updateUserCoins = async (newCoins: number) => {
    if (!user) return;

    try {
      console.log('💰 Updating user coins:', user.coins, '->', newCoins);
      
      setUser(prev => prev ? { ...prev, coins: newCoins } : null);
      
      // Log coin update
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
        // Log sign out
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
      await supabase.auth.signOut();
      setUser(null);
      
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });
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
    
    // Get current session
    const getSession = async () => {
      try {
        console.log('🔍 Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.id);
          setIsLoading(true);
          await fetchUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed for:', session.user.id);
        }
      }
    );

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
