
import { useState } from "react";
import { Crown, Link, HelpCircle, Gift, Settings, User, Globe, Shield, Bell, Volume2, Vibrate, Lock, FileText, ScrollText, Users, Copy, Share } from "lucide-react";
import PromoCodeModal from "./PromoCodeModal";
import FAQModal from "./FAQModal";
import PremiumModal from "./PremiumModal";
import ImprovedSteamConnectionModal from "./ImprovedSteamConnectionModal";
import TermsOfServiceModal from "./TermsOfServiceModal";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import LanguageSelector from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/components/ui/use-translation";

interface User {
  id: string;
  username: string;
  coins: number;
  is_admin: boolean;
  isPremium: boolean;
  language_code?: string;
  sound_enabled?: boolean;
  vibration_enabled?: boolean;
  profile_private?: boolean;
  referralCode?: string;
}

interface SettingsScreenProps {
  currentUser: User;
  onUserUpdate: (updatedUser: User) => void;
}

const SettingsScreen = ({ currentUser, onUserUpdate }: SettingsScreenProps) => {
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

      // Update user with new language code
      onUserUpdate({ ...currentUser, language_code: languageCode });

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

      // Update user state
      const updatedUser = { ...currentUser, [setting]: value };
      onUserUpdate(updatedUser);

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

  const handleCopyReferralLink = async () => {
    if (!currentUser.referralCode) {
      toast({
        title: "Создайте реферальный код",
        description: "Сначала нужно создать реферальный код",
        variant: "destructive",
      });
      return;
    }

    const referralLink = `${window.location.origin}/ref/${currentUser.referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Ссылка скопирована!",
        description: "Реферальная ссылка скопирована в буфер обмена",
      });
    } catch (error) {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Ссылка скопирована!",
        description: "Реферальная ссылка скопирована в буфер обмена",
      });
    }
  };

  const handleShareReferralLink = async () => {
    if (!currentUser.referralCode) {
      toast({
        title: "Создайте реферальный код",
        description: "Сначала нужно создать реферальный код",
        variant: "destructive",
      });
      return;
    }

    const referralLink = `${window.location.origin}/ref/${currentUser.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FastMarket - Открывай кейсы CS2!',
          text: 'Присоединяйся к FastMarket и получи бонус за регистрацию!',
          url: referralLink,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback - копируем ссылку
      handleCopyReferralLink();
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

        {/* Referral Section */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Пригласить друзей</h3>
                <p className="text-purple-300 text-sm">Получайте 50 монет за каждого друга</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-purple-400 font-bold text-lg">50 монет</div>
              <div className="text-purple-300 text-xs">за приглашение</div>
            </div>
          </div>
          
          {currentUser.referralCode ? (
            <div className="space-y-3">
              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                <p className="text-slate-300 text-sm mb-2">Ваш реферальный код:</p>
                <p className="text-white font-mono text-lg">{currentUser.referralCode}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCopyReferralLink}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Копировать ссылку
                </Button>
                <Button 
                  onClick={handleShareReferralLink}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Поделиться
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleCopyReferralLink}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl"
            >
              Копировать ссылку
            </Button>
          )}
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
            <button 
              onClick={() => {
                console.log('Opening Terms modal');
                setShowTermsModal(true);
              }}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-600/50 w-full text-left"
            >
              <div className="flex items-center space-x-3">
                <ScrollText className="w-6 h-6 text-blue-400" />
                <div>
                  <h4 className="text-white font-medium">Условия использования</h4>
                  <p className="text-slate-400 text-sm">Правила и условия пользования приложением</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            </button>

            <button 
              onClick={() => {
                console.log('Opening Privacy modal');
                setShowPrivacyModal(true);
              }}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-600/50 w-full text-left"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-purple-400" />
                <div>
                  <h4 className="text-white font-medium">Политика конфиденциальности</h4>
                  <p className="text-slate-400 text-sm">Как мы обрабатываем ваши данные</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            </button>
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
