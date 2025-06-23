
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createTestUser } from "@/utils/uuid";

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
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTestLogin = () => {
    const testUser = createTestUser();
    onUserLoad({
      ...testUser,
      quiz_lives: 3,
      quiz_streak: 0,
      is_admin: false,
      language_code: 'ru'
    });
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите имя пользователя",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Создаем тестового пользователя с введенным именем
      const user = {
        id: crypto.randomUUID(),
        username: username.trim(),
        coins: 1000,
        quiz_lives: 3,
        quiz_streak: 0,
        is_admin: false,
        language_code: 'ru'
      };
      
      onUserLoad(user);
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать аккаунт",
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
        
        <div className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Введите имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
          
          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading ? "Создание..." : "Создать аккаунт"}
          </Button>
          
          <Button
            onClick={handleTestLogin}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Войти как тестовый пользователь
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
