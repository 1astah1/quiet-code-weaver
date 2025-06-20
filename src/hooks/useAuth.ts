import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateUUID } from "@/utils/uuid";
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
    // Проверяем текущую сессию
    checkSession();

    // Слушаем изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          handleUserSignOut();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        await handleUserSignIn(session.user);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setIsLoading(false);
    }
  };

  const handleUserSignIn = async (authUser: User) => {
    try {
      console.log('Handling user sign in:', authUser.id);
      
      // Проверяем существование пользователя в нашей базе
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      let userData: AuthUser;

      if (fetchError && fetchError.code === 'PGRST116') {
        // Пользователь не существует, создаем нового
        console.log('Creating new user in database');
        
        const newUser = {
          id: authUser.id,
          username: authUser.user_metadata?.full_name || 
                   authUser.user_metadata?.name || 
                   authUser.email?.split('@')[0] || 
                   'User',
          email: authUser.email || '',
          coins: 1000, // Стартовые монеты для новых пользователей
          is_admin: false,
          referral_code: null
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
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
          description: `Вы получили 1000 стартовых монет!`,
        });
      } else if (fetchError) {
        console.error('Error fetching user:', fetchError);
        throw fetchError;
      } else {
        // Пользователь существует, используем данные из базы
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

      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);

      console.log('User signed in successfully:', userData.username);
    } catch (error) {
      console.error('Error handling user sign in:', error);
      toast({
        title: "Ошибка авторизации",
        description: "Не удалось войти в систему",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleUserSignOut = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    console.log('User signed out');
  };

  const signOut = async () => {
    try {
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