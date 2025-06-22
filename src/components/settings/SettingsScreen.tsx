
import { useState } from "react";
import { Crown, Link, HelpCircle, Gift, Settings, User, Globe, Shield, Bell, Volume2, Vibrate, Lock, FileText, ScrollText } from "lucide-react";
import PromoCodeModal from "./PromoCodeModal";
import FAQModal from "./FAQModal";
import PremiumModal from "./PremiumModal";
import ImprovedSteamConnectionModal from "./ImprovedSteamConnectionModal";
import TermsOfServiceModal from "./TermsOfServiceModal";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import LanguageSelector from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";

interface SettingsScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    language_code?: string;
    sound_enabled?: boolean;
    vibration_enabled?: boolean;
    profile_private?: boolean;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const SettingsScreen = ({ currentUser, onCoinsUpdate }: SettingsScreenProps) => {
  const { t } = useTranslation(currentUser.language_code);
  
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSteamModal, setShowSteamModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(currentUser.sound_enabled ?? true);
  const [vibrationEnabled, setVibrationEnabled] = useState(currentUser.vibration_enabled ?? true);
  const [profilePrivate, setProfilePrivate] = useState(currentUser.profile_private ?? false);
  const { toast } = useToast();

  const handleLanguageChange = async (languageCode: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ language_code: languageCode })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast({
        title: t('languageChanged'),
        description: t('languageSettingsSaved'),
      });

      // Refresh the page to apply new language
      window.location.reload();
    } catch (error) {
      console.error('Error updating language:', error);
      toast({
        title: t('error'),
        description: t('failedToChangeLanguage'),
        variant: "destructive",
      });
    }
  };

  const handleToggleSetting = async (setting: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ [setting]: value })
        .eq('id', currentUser.id);

      if (error) throw error;

      switch (setting) {
        case 'sound_enabled':
          setSoundEnabled(value);
          break;
        case 'vibration_enabled':
          setVibrationEnabled(value);
          break;
        case 'profile_private':
          setProfilePrivate(value);
          break;
      }

      toast({
        title: t('settingsSaved'),
        description: t('changesApplied'),
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: t('error'),
        description: t('failedToSaveSettings'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('settings')}</h1>
        <p className="text-slate-400">{t('accountManagement')}</p>
      </div>

      <div className="space-y-6">
        {/* Premium Section */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className="text-xl font-bold text-white">{t('premiumSubscription')}</h3>
                <p className="text-yellow-300 text-sm">{t('unlockAllFeatures')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-bold text-lg">$5/мес</div>
              <div className="text-yellow-300 text-xs">3 дня бесплатно</div>
            </div>
          </div>
          <Button 
            onClick={() => setShowPremiumModal(true)}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl"
          >
            {t('getPremium')}
          </Button>
        </div>

        {/* Account Settings */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-orange-400" />
            {t('accountSettings')}
          </h3>
          <div className="space-y-4">
            <div 
              onClick={() => setShowSteamModal(true)}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-600/50"
            >
              <div className="flex items-center space-x-3">
                <Link className="w-6 h-6 text-blue-400" />
                <div>
                  <h4 className="text-white font-medium">{t('connectSteam')}</h4>
                  <p className="text-slate-400 text-sm">{t('setupSkinWithdrawal')}</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            </div>

            <div 
              onClick={() => setShowPromoModal(true)}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-600/50"
            >
              <div className="flex items-center space-x-3">
                <Gift className="w-6 h-6 text-pink-400" />
                <div>
                  <h4 className="text-white font-medium">{t('promoCodes')}</h4>
                  <p className="text-slate-400 text-sm">{t('activateBonuses')}</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-orange-400" />
            {t('appSettings')}
          </h3>
          <div className="space-y-4">
            {/* Language */}
            <div>
              <label className="block text-white font-medium mb-2 flex items-center">
                <Globe className="w-4 h-4 mr-2 text-blue-400" />
                {t('appLanguage')}
              </label>
              <LanguageSelector 
                currentLanguage={currentUser.language_code || 'ru'}
                onLanguageChange={handleLanguageChange}
              />
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-6 h-6 text-green-400" />
                <div>
                  <h4 className="text-white font-medium">{t('sounds')}</h4>
                  <p className="text-slate-400 text-sm">{t('soundEffects')}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleSetting('sound_enabled', !soundEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  soundEnabled ? 'bg-green-500' : 'bg-slate-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  soundEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Vibration */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <div className="flex items-center space-x-3">
                <Vibrate className="w-6 h-6 text-purple-400" />
                <div>
                  <h4 className="text-white font-medium">{t('vibration')}</h4>
                  <p className="text-slate-400 text-sm">{t('tactileFeedback')}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleSetting('vibration_enabled', !vibrationEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  vibrationEnabled ? 'bg-purple-500' : 'bg-slate-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  vibrationEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Privacy */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-red-400" />
                <div>
                  <h4 className="text-white font-medium">{t('privateProfile')}</h4>
                  <p className="text-slate-400 text-sm">{t('hideStats')}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleSetting('profile_private', !profilePrivate)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  profilePrivate ? 'bg-red-500' : 'bg-slate-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  profilePrivate ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <HelpCircle className="w-5 h-5 mr-2 text-orange-400" />
            {t('support')}
          </h3>
          <div className="space-y-4">
            <div 
              onClick={() => setShowFAQModal(true)}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-600/50"
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h4 className="text-white font-medium">{t('faq')}</h4>
                  <p className="text-slate-400 text-sm">{t('findAnswers')}</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Legal Section */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-400" />
            Правовая информация
          </h3>
          <div className="space-y-4">
            <div 
              onClick={() => setShowTermsModal(true)}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-600/50"
            >
              <div className="flex items-center space-x-3">
                <ScrollText className="w-6 h-6 text-blue-400" />
                <div>
                  <h4 className="text-white font-medium">Условия использования</h4>
                  <p className="text-slate-400 text-sm">Правила и условия пользования приложением</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            </div>

            <div 
              onClick={() => setShowPrivacyModal(true)}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-600/50"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-purple-400" />
                <div>
                  <h4 className="text-white font-medium">Политика конфиденциальности</h4>
                  <p className="text-slate-400 text-sm">Как мы обрабатываем ваши данные</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
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
      
      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
      
      <ImprovedSteamConnectionModal 
        isOpen={showSteamModal}
        onClose={() => setShowSteamModal(false)}
        currentUser={currentUser}
      />

      <TermsOfServiceModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      <PrivacyPolicyModal 
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
};

export default SettingsScreen;
