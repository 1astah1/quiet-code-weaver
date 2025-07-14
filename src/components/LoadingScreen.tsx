
import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface LoadingScreenProps {
  error?: string;
}

const LoadingScreen = ({ error }: LoadingScreenProps) => {
  const [dots, setDots] = useState("");
  const [showError, setShowError] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    if (error) {
      const errorTimer = setTimeout(() => {
        setShowError(true);
      }, 3000);
      return () => clearTimeout(errorTimer);
    }
  }, [error]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Считаем время загрузки
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleReload = () => {
    console.log('🔄 [LOADING] User requested page reload after', loadingTime, 'seconds');
    window.location.reload();
  };

  const handleForceAuth = () => {
    console.log('🔄 [LOADING] User requested auth reset');
    // Очищаем все данные авторизации
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (showError && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              Ошибка загрузки
            </h2>
            <p className="text-gray-300 text-sm">
              {error}
            </p>
            <p className="text-gray-400 text-xs">
              Время загрузки: {loadingTime}с
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleReload}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Обновить страницу</span>
            </button>
            
            {loadingTime > 10 && (
              <button
                onClick={handleForceAuth}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Сбросить авторизацию
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text">
            FastMarket
          </h1>
          <h2 className="text-xl font-semibold text-orange-300">
            CASE CS2
          </h2>
        </div>

        <div className="space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-orange-200/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          
          <div className="space-y-2">
            <p className="text-white text-lg">
              Загрузка{dots}
            </p>
            
            {error && !showError && (
              <p className="text-orange-300 text-sm">
                Подключение к серверу...
              </p>
            )}
            
            {loadingTime > 5 && (
              <p className="text-gray-400 text-xs">
                Загрузка: {loadingTime}с
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 max-w-xs mx-auto">
          <p className="text-gray-300 text-sm">
            💡 Совет: Открывай кейсы и собирай редкие скины!
          </p>
        </div>

        {loadingTime > 15 && (
          <div className="text-center">
            <button
              onClick={handleReload}
              className="text-orange-400 hover:text-orange-300 text-sm underline"
            >
              Долгая загрузка? Обновить страницу
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
