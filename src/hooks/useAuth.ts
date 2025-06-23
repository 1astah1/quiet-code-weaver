
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
  quiz_lives: number;
  quiz_streak: number;
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in event');
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
          setTimeout(() => {
            if (mounted) {
              handleUserSignIn(session.user);
            }
          }, 100);
        }
      }
    );

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
      
      const displayName = authUser.user_metadata?.full_name || 
                         authUser.user_metadata?.name || 
                         authUser.user_metadata?.display_name ||
                         authUser.email?.split('@')[0] || 
                         'User';

      // Пытаемся найти существующего пользователя
      let { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching user:', fetchError);
      }

      let userData: AuthUser;

      if (!existingUser) {
        console.log('👤 Creating new user profile in database');
        
        const newUserData = {
          auth_id: authUser.id,
          username: displayName,
          email: authUser.email || '',
          coins: 1000,
          is_admin: false,
          quiz_lives: 3,
          quiz_streak: 0,
          created_at: new Date().toISOString()
        };

        // Новый пользователь автоматически получит реферальный код через триггер
        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUserData)
          .select()
          .maybeSingle();

        if (createError) {
          console.error('❌ Error creating user:', createError);
          
          // Если произошла ошибка, попробуем найти пользователя снова
          const { data: retriedUser, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .maybeSingle();

          if (retryError || !retriedUser) {
            throw new Error('Не удалось найти или создать профиль пользователя');
          }
          
          existingUser = retriedUser;
        } else if (createdUser) {
          existingUser = createdUser;
          toast({
            title: "Добро пожаловать!",
            description: `Вы получили 1000 стартовых монет! Ваш реферальный код: ${createdUser.referral_code}`,
          });
        }

        if (!existingUser) {
          throw new Error('Не удалось создать профиль пользователя');
        }
      } else {
        console.log('👤 Using existing user profile');
        
        // Проверяем, есть ли у существующего пользователя реферальный код
        if (!existingUser.referral_code) {
          console.log('🔧 Generating referral code for existing user');
          
          const referralCode = 'FM' + existingUser.id.substring(0, 8).toUpperCase();
          
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ referral_code: referralCode })
            .eq('id', existingUser.id)
            .select()
            .single();
            
          if (!updateError && updatedUser) {
            existingUser = updatedUser;
            toast({
              title: "Реферальный код создан!",
              description: `Ваш реферальный код: ${referralCode}`,
            });
          }
        }
      }

      userData = {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email || '',
        coins: existingUser.coins || 0,
        isPremium: existingUser.premium_until ? new Date(existingUser.premium_until) > new Date() : false,
        isAdmin: existingUser.is_admin || false,
        referralCode: existingUser.referral_code,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        quiz_lives: existingUser.quiz_lives || 3,
        quiz_streak: existingUser.quiz_streak || 0
      };

      console.log('✅ Setting user data:', userData.username, 'Referral code:', userData.referralCode);
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
