
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      let result;
      
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (result.error) {
        throw result.error;
      }

      if (isSignUp && !result.data.session) {
        toast({
          title: "Подтвердите регистрацию",
          description: "Проверьте почту и подтвердите регистрацию",
        });
      } else {
        toast({
          title: "Успешно!",
          description: isSignUp ? "Аккаунт создан" : "Добро пожаловать!",
        });
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось выполнить операцию",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              className="bg-slate-700/50 border-slate-600 text-white"
              required
            />
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading ? "Загрузка..." : (isSignUp ? "Создать аккаунт" : "Войти")}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-slate-400 hover:text-white text-sm"
          >
            {isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Создать"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
