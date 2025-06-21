
import { useState, useEffect } from "react";

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Предзагрузка критических ресурсов
    const preloadResources = async () => {
      // Предзагружаем основные изображения
      const imagesToPreload = [
        '/favicon.ico'
      ];

      const promises = imagesToPreload.map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });
      });

      try {
        await Promise.allSettled(promises);
      } catch (error) {
        console.log('Some resources failed to preload:', error);
      }
    };

    preloadResources();

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        // Более быстрая загрузка
        return prev + 3;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center z-50">
      {/* Background Pattern - оптимизированный */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      <div className="text-center z-10">
        {/* Logo - убрали лишние анимации для производительности */}
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-6xl font-bold text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text">
              FastMarket
            </h1>
            <h2 className="text-2xl font-semibold text-orange-300 mt-2">
              CASE CS2
            </h2>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading Bar - улучшенный */}
        <div className="w-80 mx-auto mb-4">
          <div className="bg-gray-800 rounded-full h-3 overflow-hidden border border-orange-500/30">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-200 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <p className="text-orange-300 text-sm mt-2">{progress}%</p>
        </div>

        {/* Loading Text */}
        <div className="text-gray-300 text-lg">
          Загрузка приложения...
        </div>

        {/* CS2 Style Elements - упрощенная анимация */}
        <div className="mt-8 flex justify-center space-x-4">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
