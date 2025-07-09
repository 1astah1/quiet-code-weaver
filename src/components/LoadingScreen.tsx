import { useState, useEffect } from "react";

const LoadingScreen = ({ error }: { error?: string }) => {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  // Animated loading dots
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzAwMDAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+CjwvZz4KPC9nPgo8L3N2Zz4=')]"></div>
      </div>

      <div className="text-center z-10 w-full max-w-md px-8">
        {/* Logo */}
        <div className="mb-8 animate-pulse">
          <div className="relative flex flex-col items-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mb-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl sm:text-5xl font-bold text-white">FM</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white animate-bounce">FastMarket</h1>
            <h2 className="text-2xl font-semibold text-orange-300 mt-2 animate-pulse">CASE CS2</h2>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/80 border border-red-500 text-red-200 rounded-xl text-lg font-bold animate-fade-in">
            Ошибка: {error}
          </div>
        )}

        {/* Loading Bar */}
        <div className="w-full mx-auto mb-6">
          <div className="bg-gray-800 rounded-full h-3 overflow-hidden border border-orange-500/30 shadow-lg">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-300 ease-out relative animate-slide"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-orange-300 text-sm font-medium">{progress}%</p>
            <div className="text-orange-300 text-sm">
              Загрузка{dots}
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-gray-300 text-lg animate-pulse mb-6">
          Инициализация приложения...
        </div>

        {/* CS2 Style Elements */}
        <div className="flex justify-center space-x-4 mb-6">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping delay-0"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping delay-150"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping delay-300"></div>
        </div>

        {/* Status Messages */}
        <div className="text-sm text-gray-400 animate-fade-in">
          {progress < 30 && "Подключение к серверу..."}
          {progress >= 30 && progress < 60 && "Загрузка данных пользователя..."}
          {progress >= 60 && progress < 90 && "Инициализация интерфейса..."}
          {progress >= 90 && "Почти готово..."}
        </div>
      </div>

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-slide {
          animation: slide 1.5s infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
