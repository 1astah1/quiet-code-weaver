
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Settings, Crown, Shield } from "lucide-react";

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

interface ProfileScreenProps {
  currentUser: User;
  onCoinsUpdate: (newCoins: number) => void;
}

const ProfileScreen = ({ currentUser, onCoinsUpdate }: ProfileScreenProps) => {
  const [username, setUsername] = useState(currentUser.username);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Здесь будет логика сохранения профиля
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 pt-6">
      <div className="max-w-md mx-auto">
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          {/* Аватар */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">
                {currentUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center justify-center space-x-2 mb-2">
              <h2 className="text-xl font-bold text-white">{currentUser.username}</h2>
              {currentUser.premium_until && (
                <Crown className="w-5 h-5 text-yellow-400" />
              )}
              {currentUser.is_admin && (
                <Shield className="w-5 h-5 text-red-400" />
              )}
            </div>
            
            <p className="text-slate-400">ID: {currentUser.id.slice(0, 8)}...</p>
          </div>

          {/* Статистика */}
          <div className="space-y-4 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Монеты</span>
                <span className="text-yellow-400 font-bold">{currentUser.coins}</span>
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Жизни викторины</span>
                <span className="text-blue-400 font-bold">{currentUser.quiz_lives}</span>
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Стрик викторины</span>
                <span className="text-green-400 font-bold">{currentUser.quiz_streak}</span>
              </div>
            </div>
          </div>

          {/* Редактирование профиля */}
          <div className="space-y-4">
            {isEditing ? (
              <>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="Имя пользователя"
                />
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Сохранить
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300"
                  >
                    Отмена
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-slate-700 hover:bg-slate-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                Редактировать профиль
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
