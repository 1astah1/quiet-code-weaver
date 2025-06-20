
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Volume2, VolumeX, Smartphone, SmartphoneNfc, Globe, HelpCircle, Gift, Key } from "lucide-react";
import SteamConnectionModal from "./SteamConnectionModal";
import PromoCodeModal from "./PromoCodeModal";
import FAQModal from "./FAQModal";

interface SettingsScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    isAdmin?: boolean;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const SettingsScreen = ({ currentUser }: SettingsScreenProps) => {
  const [showSteamModal, setShowSteamModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загружаем настройки пользователя
  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Если настроек нет, создаем их с дефолтными значениями
      if (!data) {
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({
            user_id: currentUser.id,
            sound_enabled: true,
            vibration_enabled: true,
            language_code: 'ru',
            profile_private: false
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return newSettings;
      }
      
      return data;
    }
  });

  const [localSettings, setLocalSettings] = useState({
    sound_enabled: true,
    vibration_enabled: true,
    language_code: 'ru',
    profile_private: false
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        sound_enabled: settings.sound_enabled ?? true,
        vibration_enabled: settings.vibration_enabled ?? true,
        language_code: settings.language_code ?? 'ru',
        profile_private: settings.profile_private ?? false
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof localSettings) => {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          ...newSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', currentUser.id] });
      toast({
        title: "Настройки сохранены",
        description: "Ваши настройки успешно обновлены",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить настройки",
        variant: "destructive",
      });
    }
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  const updateSetting = (key: keyof typeof localSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4 flex items-center justify-center">
        <div className="text-white">Загрузка настроек...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Настройки</h1>

        <div className="space-y-4">
          {/* Профиль */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-semibold text-white">Профиль</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Приватный профиль</span>
                <button
                  onClick={() => updateSetting('profile_private', !localSettings.profile_private)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    localSettings.profile_private ? 'bg-orange-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    localSettings.profile_private ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Звук и уведомления */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <Volume2 className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-semibold text-white">Звук и уведомления</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {localSettings.sound_enabled ? (
                    <Volume2 className="w-4 h-4 text-gray-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-gray-300">Звуки</span>
                </div>
                <button
                  onClick={() => updateSetting('sound_enabled', !localSettings.sound_enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    localSettings.sound_enabled ? 'bg-orange-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    localSettings.sound_enabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {localSettings.vibration_enabled ? (
                    <SmartphoneNfc className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-gray-300">Вибрация</span>
                </div>
                <button
                  onClick={() => updateSetting('vibration_enabled', !localSettings.vibration_enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    localSettings.vibration_enabled ? 'bg-orange-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    localSettings.vibration_enabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Язык */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-semibold text-white">Язык</h2>
            </div>
            
            <select
              value={localSettings.language_code}
              onChange={(e) => updateSetting('language_code', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500"
            >
              <option value="ru">🇷🇺 Русский</option>
              <option value="en">🇺🇸 English</option>
              <option value="uk">🇺🇦 Українська</option>
            </select>
          </div>

          {/* Дополнительные функции */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
            <h2 className="text-lg font-semibold text-white mb-4">Дополнительно</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowSteamModal(true)}
                className="w-full flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span className="text-gray-300">Подключить Steam</span>
                <span className="text-orange-400">→</span>
              </button>

              <button
                onClick={() => setShowPromoModal(true)}
                className="w-full flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Gift className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Промокод</span>
                </div>
                <span className="text-orange-400">→</span>
              </button>

              <button
                onClick={() => setShowFAQModal(true)}
                className="w-full flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Часто задаваемые вопросы</span>
                </div>
                <span className="text-orange-400">→</span>
              </button>
            </div>
          </div>

          {/* Кнопка сохранения */}
          <button
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{updateSettingsMutation.isPending ? 'Сохранение...' : 'Сохранить настройки'}</span>
          </button>
        </div>
      </div>

      {/* Модальные окна */}
      {showSteamModal && (
        <SteamConnectionModal
          isOpen={showSteamModal}
          currentUser={currentUser}
          onClose={() => setShowSteamModal(false)}
        />
      )}

      {showPromoModal && (
        <PromoCodeModal
          isOpen={showPromoModal}
          currentUser={currentUser}
          onClose={() => setShowPromoModal(false)}
          onCoinsUpdate={() => {}}
        />
      )}

      {showFAQModal && (
        <FAQModal 
          isOpen={showFAQModal}
          onClose={() => setShowFAQModal(false)} 
        />
      )}
    </div>
  );
};

export default SettingsScreen;
