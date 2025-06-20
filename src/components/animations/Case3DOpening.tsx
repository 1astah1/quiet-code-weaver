
import { useState, useEffect } from "react";

const Case3DOpening = () => {
  const [phase, setPhase] = useState<'sealed' | 'glowing' | 'opening' | 'complete'>('sealed');

  useEffect(() => {
    console.log('Case3DOpening: Starting animation sequence');
    
    const timer1 = setTimeout(() => {
      console.log('Case3DOpening: Phase glowing');
      setPhase('glowing');
    }, 1000);

    const timer2 = setTimeout(() => {
      console.log('Case3DOpening: Phase opening');
      setPhase('opening');
    }, 2000);

    const timer3 = setTimeout(() => {
      console.log('Case3DOpening: Phase complete');
      setPhase('complete');
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Заголовок */}
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
        {phase === 'sealed' && 'Подготовка кейса...'}
        {phase === 'glowing' && 'Активация энергии...'}
        {phase === 'opening' && 'Кейс раскрывается...'}
        {phase === 'complete' && 'Готово к извлечению!'}
      </h2>
      
      {/* Основной кейс */}
      <div className="relative">
        <div 
          className={`w-48 h-48 transition-all duration-1000 ${
            phase === 'sealed' ? 'scale-100 rotate-0' :
            phase === 'glowing' ? 'scale-110 rotate-12' :
            phase === 'opening' ? 'scale-125 rotate-45' :
            'scale-150 rotate-180'
          }`}
        >
          <div className={`w-full h-full bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-3xl flex items-center justify-center text-8xl transition-all duration-500 border-4 ${
            phase === 'sealed' ? 'border-slate-500' :
            phase === 'glowing' ? 'border-blue-500 shadow-blue-500/50 shadow-2xl' :
            phase === 'opening' ? 'border-purple-500 shadow-purple-500/50 shadow-2xl' :
            'border-yellow-500 shadow-yellow-500/50 shadow-2xl'
          }`}>
            📦
          </div>
        </div>

        {/* Энергетические эффекты */}
        {phase !== 'sealed' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-64 h-64 border-2 rounded-full animate-spin ${
              phase === 'glowing' ? 'border-blue-400/50' :
              phase === 'opening' ? 'border-purple-400/50' :
              'border-yellow-400/70'
            }`} style={{ animationDuration: '3s' }} />
          </div>
        )}
      </div>

      {/* Статус */}
      <div className="mt-8 flex justify-center">
        <div className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-500 ${
          phase === 'sealed' ? 'bg-slate-700 text-slate-300' :
          phase === 'glowing' ? 'bg-blue-500/20 text-blue-400' :
          phase === 'opening' ? 'bg-purple-500/20 text-purple-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {phase === 'sealed' && '🔐 Инициализация...'}
          {phase === 'glowing' && '⚡ Зарядка энергии...'}
          {phase === 'opening' && '🌟 Открытие...'}
          {phase === 'complete' && '💥 Извлечение!'}
        </div>
      </div>
    </div>
  );
};

export default Case3DOpening;
