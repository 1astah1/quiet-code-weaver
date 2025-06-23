
import { useState, useEffect } from "react";

interface LoadingScreenProps {
  timeout?: number;
  onTimeout?: () => void;
}

const LoadingScreen = ({ timeout = 8000, onTimeout }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + 3;
      });
    }, 100);

    // Показываем кнопку обновления после таймаута
    const timeoutTimer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutTimer);
    };
  }, [timeout]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center z-50">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzAwMDAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+CjwvZz4KPC9nPgo8L3N2Zz4=')]"></div>
      </div>

      <div className="text-center z-10">
        <div className="mb-8 animate-pulse">
          <div className="relative">
            <h1 className="text-6xl font-bold text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text">
              FastMarket
            </h1>
            <h2 className="text-2xl font-semibold text-orange-300 mt-2">
              CASE CS2
            </h2>
          </div>
        </div>

        <div className="w-80 mx-auto mb-4">
          <div className="bg-gray-800 rounded-full h-3 overflow-hidden border border-orange-500/30">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <p className="text-orange-300 text-sm mt-2">{Math.min(progress, 100)}%</p>
        </div>

        <div className="text-gray-300 text-lg animate-pulse mb-6">
          Загружаем приложение...
        </div>

        {showTimeout && (
          <div className="mb-6">
            <button
              onClick={handleReload}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Обновить страницу
            </button>
            <p className="text-gray-400 text-sm mt-2">
              Загрузка занимает слишком много времени
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-center space-x-4">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping delay-0"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping delay-150"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
