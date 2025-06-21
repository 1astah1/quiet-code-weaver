
import { useState, useEffect } from "react";
import { loadingOptimizer } from "@/utils/loadingOptimizer";

interface OptimizedLoadingScreenProps {
  onLoadingComplete: () => void;
}

const OptimizedLoadingScreen = ({ onLoadingComplete }: OptimizedLoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('initializing');

  useEffect(() => {
    loadingOptimizer.startLoading('app-init');
    
    const stages = [
      { name: 'initializing', duration: 200, text: 'Инициализация...' },
      { name: 'connecting', duration: 300, text: 'Подключение...' },
      { name: 'loading-data', duration: 400, text: 'Загрузка данных...' },
      { name: 'finishing', duration: 200, text: 'Завершение...' }
    ];

    let currentProgress = 0;
    let stageIndex = 0;

    const progressInterval = setInterval(() => {
      const stage = stages[stageIndex];
      if (!stage) {
        clearInterval(progressInterval);
        return;
      }

      setLoadingStage(stage.name);
      
      const increment = 100 / stages.length / (stage.duration / 50);
      currentProgress += increment;

      if (currentProgress >= (stageIndex + 1) * (100 / stages.length)) {
        stageIndex++;
        if (stageIndex >= stages.length) {
          setProgress(100);
          clearInterval(progressInterval);
          
          setTimeout(async () => {
            await loadingOptimizer.finishLoading('app-init');
            onLoadingComplete();
          }, 200);
        }
      } else {
        setProgress(Math.min(currentProgress, 100));
      }
    }, 50);

    // Предзагрузка критических ресурсов
    const preloadCriticalResources = async () => {
      try {
        // Предзагружаем важные изображения
        const criticalImages = ['/favicon.ico'];
        const imagePromises = criticalImages.map(src => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = img.onerror = resolve;
            img.src = src;
          });
        });
        
        await Promise.allSettled(imagePromises);
      } catch (error) {
        console.log('Preload completed with some errors:', error);
      }
    };

    preloadCriticalResources();

    return () => {
      clearInterval(progressInterval);
    };
  }, [onLoadingComplete]);

  const getStageText = () => {
    switch (loadingStage) {
      case 'initializing': return 'Инициализация приложения...';
      case 'connecting': return 'Установка соединения...';
      case 'loading-data': return 'Загрузка пользовательских данных...';
      case 'finishing': return 'Подготовка интерфейса...';
      default: return 'Загрузка...';
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-orange-900 flex items-center justify-center z-50">
      {/* Optimized background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      <div className="text-center z-10">
        {/* Logo */}
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

        {/* Optimized loading bar */}
        <div className="w-80 mx-auto mb-4">
          <div className="bg-gray-800 rounded-full h-3 overflow-hidden border border-orange-500/30">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <p className="text-orange-300 text-sm mt-2">{Math.round(progress)}%</p>
        </div>

        {/* Loading stage text */}
        <div className="text-gray-300 text-lg mb-4">
          {getStageText()}
        </div>

        {/* Simplified animation */}
        <div className="flex justify-center space-x-4">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedLoadingScreen;
