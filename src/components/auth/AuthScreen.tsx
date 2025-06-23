
import { useState } from "react";
import { supabase, cleanupAuthState } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import TermsOfServiceModal from "@/components/settings/TermsOfServiceModal";
import PrivacyPolicyModal from "@/components/settings/PrivacyPolicyModal";

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

const AuthScreen = ({ onAuthSuccess }: AuthScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { toast } = useToast();

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      setIsLoading(true);
      setLoadingProvider(provider);

      console.log(`🚀 Starting ${provider} authentication...`);

      // Очищаем предыдущее состояние аутентификации
      cleanupAuthState();

      // Пытаемся выйти из всех сессий перед новым входом
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Previous signout attempt:', err);
      }

      // Небольшая задержка для очистки состояния
      await new Promise(resolve => setTimeout(resolve, 500));

      const redirectUrl = `${window.location.origin}/`;
      console.log(`🔗 Redirect URL: ${redirectUrl}`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Позволяет выбрать аккаунт для Google
          }
        }
      });

      if (error) {
        console.error(`❌ ${provider} auth error:`, error);
        
        // Более подробное описание ошибок
        let errorMessage = `Не удалось войти через ${provider}.`;
        
        if (error.message.includes('popup')) {
          errorMessage += ' Попробуйте разрешить всплывающие окна в браузере.';
        } else if (error.message.includes('network')) {
          errorMessage += ' Проверьте подключение к интернету.';
        } else if (error.message.includes('unauthorized')) {
          errorMessage += ' Проблема с настройками OAuth.';
        }
        
        toast({
          title: "Ошибка авторизации",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      console.log(`✅ ${provider} auth initiated successfully`);
      
      // Успешная авторизация будет обработана в useAuth через onAuthStateChange
    } catch (error) {
      console.error('🚨 Auth error:', error);
      
      let errorMessage = "Произошла ошибка при авторизации";
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Проблема с подключением к серверу. Проверьте интернет-соединение.";
        } else if (error.message.includes('popup')) {
          errorMessage = "Не удалось открыть окно авторизации. Разрешите всплывающие окна.";
        }
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '🔍';
      case 'apple':
        return '🍎';
      case 'facebook':
        return '📘';
      default:
        return '🔐';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      case 'facebook':
        return 'Facebook';
      default:
        return provider;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzAwMDAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+CjwvZz4KPC9nPgo8L3N2Zz4=')]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text mb-2">
            FastMarket
          </h1>
          <h2 className="text-xl font-semibold text-orange-300 mb-4">
            CASE CS2
          </h2>
          <p className="text-gray-300 text-lg">
            Добро пожаловать! Войдите, чтобы начать
          </p>
        </div>

        {/* Connection Status */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Подключение к серверу</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30 shadow-2xl">
          <h3 className="text-white text-xl font-semibold text-center mb-6">
            Выберите способ входа
          </h3>

          <div className="space-y-4">
            {/* Google Auth */}
            <button
              onClick={() => handleSocialAuth('google')}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loadingProvider === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="text-xl">{getProviderIcon('google')}</span>
              )}
              <span>Войти через {getProviderName('google')}</span>
            </button>

            {/* Apple Auth */}
            <button
              onClick={() => handleSocialAuth('apple')}
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] border border-gray-700"
            >
              {loadingProvider === 'apple' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="text-xl">{getProviderIcon('apple')}</span>
              )}
              <span>Войти через {getProviderName('apple')}</span>
            </button>

            {/* Facebook Auth */}
            <button
              onClick={() => handleSocialAuth('facebook')}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loadingProvider === 'facebook' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="text-xl">{getProviderIcon('facebook')}</span>
              )}
              <span>Войти через {getProviderName('facebook')}</span>
            </button>
          </div>

          {/* Troubleshooting Info */}
          {isLoading && (
            <div className="mt-4 text-center text-sm text-gray-400">
              <p>Если вход не работает:</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>• Разрешите всплывающие окна</li>
                <li>• Проверьте интернет-соединение</li>
                <li>• Попробуйте обновить страницу</li>
              </ul>
            </div>
          )}

          {/* Terms */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Входя в систему, вы соглашаетесь с{' '}
              <button 
                onClick={() => setShowTermsModal(true)}
                className="text-orange-400 hover:text-orange-300 underline"
              >
                Условиями использования
              </button>{' '}
              и{' '}
              <button 
                onClick={() => setShowPrivacyModal(true)}
                className="text-orange-400 hover:text-orange-300 underline"
              >
                Политикой конфиденциальности
              </button>
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20">
            <div className="text-2xl mb-2">🎁</div>
            <p className="text-white text-sm font-medium">Открывай кейсы</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-white text-sm font-medium">Зарабатывай монеты</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-white text-sm font-medium">Получай скины</p>
          </div>
        </div>
      </div>

      {/* Modals */}
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

export default AuthScreen;
