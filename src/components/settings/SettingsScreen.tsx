
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Shield, 
  Globe,
  Gift,
  HelpCircle,
  Star,
  Link
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SteamConnectionModal from "./SteamConnectionModal";
import PremiumModal from "./PremiumModal";
import PromoCodeModal from "./PromoCodeModal";
import FAQModal from "./FAQModal";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/hooks/useLanguage";

interface SettingsScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    isPremium: boolean;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const SettingsScreen = ({ currentUser, onCoinsUpdate }: SettingsScreenProps) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [showSteamModal, setShowSteamModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const { toast } = useToast();
  const { currentLanguage, changeLanguage, isLoading: languageLoading } = useLanguage(currentUser.id);

  const updateSetting = async (field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ [field]: value })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast({
        title: "Настройки обновлены",
        description: "Изменения сохранены",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    updateSetting('sound_enabled', enabled);
  };

  const handleVibrationToggle = (enabled: boolean) => {
    setVibrationEnabled(enabled);
    updateSetting('vibration_enabled', enabled);
  };

  const handlePrivacyToggle = (isPrivate: boolean) => {
    setProfilePrivate(isPrivate);
    updateSetting('profile_private', isPrivate);
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Настройки</h1>
      </div>

      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Language Settings */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Язык приложения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={changeLanguage}
            />
          </CardContent>
        </Card>

        {/* Audio & Vibration Settings */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Звук и вибрация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? 
                  <Volume2 className="w-5 h-5 text-green-400" /> : 
                  <VolumeX className="w-5 h-5 text-red-400" />
                }
                <span className="text-white">Звуки в игре</span>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <span className="text-white">Вибрация</span>
              </div>
              <Switch
                checked={vibrationEnabled}
                onCheckedChange={handleVibrationToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Приватность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white">Приватный профиль</span>
                <p className="text-gray-400 text-sm">Скрыть статистику от других игроков</p>
              </div>
              <Switch
                checked={profilePrivate}
                onCheckedChange={handlePrivacyToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account & Services */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Аккаунт и сервисы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setShowSteamModal(true)}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all hover:scale-[1.02]"
            >
              <Link className="w-5 h-5 mr-2" />
              Подключить Steam
            </Button>

            <Button
              onClick={() => setShowPremiumModal(true)}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-all hover:scale-[1.02]"
            >
              <Star className="w-5 h-5 mr-2" />
              Premium подписка
              {currentUser.isPremium && (
                <Badge className="ml-2 bg-yellow-600">Активна</Badge>
              )}
            </Button>

            <Button
              onClick={() => setShowPromoModal(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all hover:scale-[1.02]"
            >
              <Gift className="w-5 h-5 mr-2" />
              Активировать промокод
            </Button>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Помощь и поддержка</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowFAQModal(true)}
              variant="outline"
              className="w-full border-slate-600 text-white hover:bg-slate-700"
            >
              <HelpCircle className="w-5 h-5 mr-2" />
              Часто задаваемые вопросы
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <SteamConnectionModal
        isOpen={showSteamModal}
        onClose={() => setShowSteamModal(false)}
        currentUser={currentUser}
      />

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        currentUser={currentUser}
        onCoinsUpdate={onCoinsUpdate}
      />

      <PromoCodeModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        currentUser={currentUser}
        onCoinsUpdate={onCoinsUpdate}
      />

      <FAQModal
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
      />
    </div>
  );
};

export default SettingsScreen;
