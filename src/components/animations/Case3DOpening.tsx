
import { useState, useEffect } from "react";

const Case3DOpening = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    console.log('Case3DOpening: Starting');
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-900">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        Открытие кейса...
      </h2>
      
      <div className="relative mb-8">
        <div className="w-48 h-48 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center text-6xl border-4 border-orange-500/50 shadow-lg shadow-orange-500/20">
          📦
        </div>
        
        <div className="absolute -inset-4 border-2 border-orange-400 rounded-3xl opacity-50"></div>
      </div>

      <div className="w-64 bg-slate-700 rounded-full h-4 mb-4">
        <div 
          className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <p className="text-orange-400 text-lg font-semibold">
        {progress < 30 && 'Инициализация...'}
        {progress >= 30 && progress < 70 && 'Активация кейса...'}
        {progress >= 70 && progress < 100 && 'Открытие...'}
        {progress === 100 && 'Готово!'}
      </p>
    </div>
  );
};

export default Case3DOpening;
