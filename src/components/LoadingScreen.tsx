
import { useState, useEffect } from "react";

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 50; // Очень быстрое увеличение
      });
    }, 20); // Частые обновления для плавности

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center z-50">
      <div className="text-center z-10">
        {/* Упрощенный логотип */}
        <div className="mb-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text">
            FastMarket
          </h1>
          <h2 className="text-lg sm:text-xl font-semibold text-orange-300 mt-1">
            CASE CS2
          </h2>
        </div>

        {/* Быстрая загрузочная полоса */}
        <div className="w-64 sm:w-72 mx-auto mb-3">
          <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-orange-300 text-xs mt-1">{Math.round(progress)}%</p>
        </div>

        <div className="text-gray-300 text-sm">
          Загрузка...
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
