import { useState, useEffect } from "react";

const Case3DOpening = () => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'initializing' | 'unlocking' | 'opening' | 'revealing'>('initializing');

  useEffect(() => {
    console.log('🎬 [CS2_CASE_OPENING] Starting CS2-style case opening animation');
    
    // Этап 1: Инициализация (0-25%)
    const timer1 = setTimeout(() => {
      setStage('unlocking');
      setProgress(25);
    }, 800);

    // Этап 2: Разблокировка (25-60%)
    const timer2 = setTimeout(() => {
      setStage('opening');
      setProgress(60);
    }, 1600);

    // Этап 3: Открытие (60-90%)
    const timer3 = setTimeout(() => {
      setStage('revealing');
      setProgress(90);
    }, 2400);

    // Этап 4: Завершение (90-100%)
    const timer4 = setTimeout(() => {
      setProgress(100);
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const getStageText = () => {
    switch (stage) {
      case 'initializing':
        return 'Инициализация кейса...';
      case 'unlocking':
        return 'Разблокировка...';
      case 'opening':
        return 'Открытие кейса...';
      case 'revealing':
        return 'Раскрытие содержимого...';
      default:
        return 'Подготовка...';
    }
  };

  const getStageIcon = () => {
    switch (stage) {
      case 'initializing':
        return '🔧';
      case 'unlocking':
        return '🔓';
      case 'opening':
        return '📦';
      case 'revealing':
        return '✨';
      default:
        return '📦';
    }
  };

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Фоновые эффекты */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,165,0,0.1)_0%,_transparent_70%)] animate-pulse"></div>
      
      {/* Основной контент */}
      <div className="relative z-10 text-center">
        <h2 className="text-4xl font-bold text-white mb-8 text-center animate-pulse">
          Открытие кейса
        </h2>
        
        {/* 3D кейс */}
        <div className="relative mb-8">
          <div className="w-64 h-64 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 rounded-2xl flex items-center justify-center text-8xl border-4 border-orange-500/50 shadow-2xl shadow-orange-500/30 transform perspective-1000 rotate-y-12 animate-pulse">
            {getStageIcon()}
          </div>
          
          {/* Эффект свечения */}
          <div className="absolute -inset-4 border-2 border-orange-400 rounded-3xl opacity-50 animate-ping"></div>
          <div className="absolute -inset-2 border border-orange-300 rounded-3xl opacity-30 animate-pulse"></div>
          
          {/* Частицы */}
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s'
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Прогресс бар */}
        <div className="w-80 bg-slate-700 rounded-full h-3 mb-6 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Текст этапа */}
        <p className="text-orange-400 text-xl font-semibold mb-4 animate-pulse">
          {getStageText()}
        </p>
        
        {/* Процент выполнения */}
        <p className="text-slate-300 text-lg">
          {progress}%
        </p>
        
        {/* Дополнительные эффекты */}
        <div className="mt-8 flex space-x-4">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
      
      {/* Анимированные линии */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-orange-500 to-transparent animate-pulse" style={{ animationDelay: '0.25s' }}></div>
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-orange-500 to-transparent animate-pulse" style={{ animationDelay: '0.75s' }}></div>
      </div>
    </div>
  );
};

export default Case3DOpening;
