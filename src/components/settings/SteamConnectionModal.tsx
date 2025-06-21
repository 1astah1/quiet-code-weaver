
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Link, User, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SteamConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
}

interface SteamSettings {
  id: string;
  steam_id: string;
  steam_nickname: string;
  steam_avatar_url: string;
  connected_at: string;
}

const SteamConnectionModal = ({ isOpen, onClose, currentUser }: SteamConnectionModalProps) => {
  const [steamId, setSteamId] = useState("");
  const { toast } = useToast();

  const { data: steamSettings, refetch } = useQuery({
    queryKey: ['steam-settings', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_steam_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as SteamSettings | null;
    },
    enabled: isOpen
  });

  const connectSteamMutation = useMutation({
    mutationFn: async (steamId: string) => {
      // Симуляция получения данных Steam (в реальном приложении здесь был бы API запрос)
      const mockSteamData = {
        steam_id: steamId,
        steam_nickname: `SteamPlayer_${steamId.slice(-4)}`,
        steam_avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${steamId}`
      };

      const { data, error } = await supabase
        .from('user_steam_settings')
        .upsert({
          user_id: currentUser.id,
          ...mockSteamData
        })
        .select()
        .single();

      if (error) throw error;

      // Обновляем основную информацию пользователя с данными Steam
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          username: mockSteamData.steam_nickname,
          steam_connected: true
        })
        .eq('id', currentUser.id);

      if (userUpdateError) {
        console.error('Error updating user with Steam data:', userUpdateError);
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Steam подключен!",
        description: "Аккаунт Steam успешно подключен. Никнейм и аватар обновлены.",
      });
      refetch();
      setSteamId("");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключить Steam аккаунт",
        variant: "destructive",
      });
    }
  });

  const disconnectSteamMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_steam_settings')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Убираем флаг подключения Steam
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ steam_connected: false })
        .eq('id', currentUser.id);

      if (userUpdateError) {
        console.error('Error updating user steam status:', userUpdateError);
      }
    },
    onSuccess: () => {
      toast({
        title: "Steam отключен",
        description: "Аккаунт Steam отключен",
      });
      refetch();
    }
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (steamId.trim()) {
      connectSteamMutation.mutate(steamId.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-md border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Steam</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {steamSettings ? (
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700">
                    {steamSettings.steam_avatar_url ? (
                      <img 
                        src={steamSettings.steam_avatar_url} 
                        alt="Steam Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{steamSettings.steam_nickname}</h4>
                    <p className="text-slate-400 text-sm">ID: {steamSettings.steam_id}</p>
                    <p className="text-green-400 text-xs">
                      Подключен {new Date(steamSettings.connected_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => disconnectSteamMutation.mutate()}
                disabled={disconnectSteamMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all"
              >
                {disconnectSteamMutation.isPending ? "Отключение..." : "Отключить Steam"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-slate-300 mb-4">
                  Подключите свой Steam аккаунт для вывода скинов и автоматического обновления никнейма и аватара
                </p>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <ExternalLink className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Как найти Steam ID:</p>
                      <p>1. Откройте Steam и перейдите в профиль</p>
                      <p>2. Скопируйте числовой ID из URL профиля</p>
                      <p className="mt-2 text-green-300">✓ Никнейм и аватар обновятся автоматически</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Steam ID</label>
                  <input
                    type="text"
                    value={steamId}
                    onChange={(e) => setSteamId(e.target.value)}
                    placeholder="Введите ваш Steam ID"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!steamId.trim() || connectSteamMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition-all hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {connectSteamMutation.isPending ? "Подключение..." : "Подключить Steam"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SteamConnectionModal;
