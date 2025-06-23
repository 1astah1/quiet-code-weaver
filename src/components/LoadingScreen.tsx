
import { useState, useEffect } from "react";

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzAwMDAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+CjwvZz4KPC9nPgo8L3N2Zz4=')]"></div>
      </div>

      <div className="text-center z-10">
        {/* Logo */}
        <div className="mb-8 animate-pulse">
          <div className="relative">
            <h1 className="text-6xl font-bold text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text animate-bounce">
              FastMarket
            </h1>
            <h2 className="text-2xl font-semibold text-orange-300 mt-2 animate-pulse">
              CASE CS2
            </h2>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Loading Bar */}
        <div className="w-80 mx-auto mb-4">
          <div className="bg-gray-800 rounded-full h-3 overflow-hidden border border-orange-500/30">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <p className="text-orange-300 text-sm mt-2">{progress}%</p>
        </div>

        {/* Loading Text */}
        <div className="text-gray-300 text-lg animate-pulse">
          Загрузка приложения...
        </div>

        {/* CS2 Style Elements */}
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
