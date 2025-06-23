
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/utils/authCleanup";

interface User {
  id: string;
  username: string;
  coins: number;
  quiz_lives: number;
  quiz_streak: number;
  is_admin?: boolean;
  language_code?: string;
  premium_until?: string;
}

interface WelcomeScreenProps {
  onUserLoad: (user: User) => void;
}

const WelcomeScreen = ({ onUserLoad }: WelcomeScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите email и пароль",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Очищаем состояние перед попыткой входа
      cleanupAuthState();
      
      // Пытаемся выйти из всех существующих сессий
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log("No existing session to sign out");
      }

      let result;
      
      if (isSignUp) {
        // Регистрация
        result = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (result.error) {
          throw result.error;
        }

        if (!result.data.session) {
          // Требуется подтверждение email
          toast({
            title: "Подтвердите регистрацию",
            description: "Проверьте почту и подтвердите регистрацию",
          });
          setLoading(false);
          return;
        }
      } else {
        // Вход
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (result.error) {
          throw result.error;
        }
      }

      if (result.data.session?.user) {
        // Успешная аутентификация, загружаем профиль пользователя
        await loadUserProfileAndNotify(result.data.session.user.id);
        
        toast({
          title: "Успешно!",
          description: isSignUp ? "Аккаунт создан" : "Добро пожаловать!",
        });
      }
      
    } catch (error: any) {
      console.error("Auth error:", error);
      
      let errorMessage = "Не удалось выполнить операцию";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Неверный email или пароль";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "Пользователь уже зарегистрирован";
      } else if (error.message?.includes("Password should be at least")) {
        errorMessage = "Пароль должен содержать минимум 6 символов";
      } else if (error.message?.includes("Unable to validate email address")) {
        errorMessage = "Неверный формат email";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfileAndNotify = async (authId: string) => {
    try {
      console.log("🔄 Loading user profile from WelcomeScreen:", authId);
      
      // Пытаемся найти существующего пользователя
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();

      if (error) {
        console.error("❌ Error loading user profile:", error);
        return;
      }

      let userData: User;

      if (data) {
        // Пользователь найден
        userData = {
          id: data.id,
          username: data.username,
          coins: data.coins || 0,
          quiz_lives: data.quiz_lives || 3,
          quiz_streak: data.quiz_streak || 0,
          is_admin: data.is_admin || false,
          language_code: data.language_code || 'ru',
          premium_until: data.premium_until
        };
      } else {
        // Создаем нового пользователя
        const { data: authUser } = await supabase.auth.getUser();
        if (!authUser.user) return;

        const newUser = {
          auth_id: authId,
          username: authUser.user.email?.split('@')[0] || 'User',
          coins: 1000,
          quiz_lives: 3,
          quiz_streak: 0,
          is_admin: false,
          language_code: 'ru'
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .maybeSingle();

        if (createError) {
          console.error("❌ Error creating user:", createError);
          return;
        }

        if (!createdUser) {
          console.error("❌ No user data returned after creation");
          return;
        }

        userData = {
          id: createdUser.id,
          username: createdUser.username,
          coins: createdUser.coins,
          quiz_lives: createdUser.quiz_lives,
          quiz_streak: createdUser.quiz_streak,
          is_admin: createdUser.is_admin,
          language_code: createdUser.language_code,
          premium_until: createdUser.premium_until
        };
      }

      console.log("✅ User data prepared, notifying parent:", userData.username);
      onUserLoad(userData);
      
    } catch (error) {
      console.error("❌ Error in loadUserProfileAndNotify:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 rounded-2xl p-8 w-full max-w-md border border-slate-700/50">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">FastMarket</h1>
          <p className="text-slate-400">Добро пожаловать в мир кейсов CS2!</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Загрузка..." : (isSignUp ? "Создать аккаунт" : "Войти")}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
            className="text-slate-400 hover:text-white text-sm disabled:opacity-50"
          >
            {isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Создать"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
