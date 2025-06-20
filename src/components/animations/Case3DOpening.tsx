
import { useState, useEffect } from "react";

const Case3DOpening = () => {
  const [phase, setPhase] = useState<'initial' | 'glowing' | 'opening' | 'complete'>('initial');

  useEffect(() => {
    console.log('Case3DOpening: Starting animation');
    
    const timer1 = setTimeout(() => {
      setPhase('glowing');
    }, 500);

    const timer2 = setTimeout(() => {
      setPhase('opening');
    }, 1500);

    const timer3 = setTimeout(() => {
      setPhase('complete');
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        {phase === 'initial' && 'Подготовка кейса...'}
        {phase === 'glowing' && 'Активация...'}
        {phase === 'opening' && 'Открытие кейса...'}
        {phase === 'complete' && 'Готово!'}
      </h2>
      
      <div className="relative">
        <div 
          className={`w-48 h-48 transition-all duration-1000 ease-in-out ${
            phase === 'initial' ? 'scale-100' :
            phase === 'glowing' ? 'scale-110' :
            phase === 'opening' ? 'scale-125' :
            'scale-150'
          }`}
        >
          <div className={`w-full h-full rounded-3xl flex items-center justify-center text-8xl transition-all duration-500 border-4 ${
            phase === 'initial' ? 'bg-slate-700 border-slate-500' :
            phase === 'glowing' ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-400/50' :
            phase === 'opening' ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-400/50' :
            'bg-yellow-500 border-yellow-300 shadow-lg shadow-yellow-400/50'
          }`}>
            📦
          </div>
        </div>

        {phase !== 'initial' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-64 h-64 border-2 rounded-full animate-spin ${
              phase === 'glowing' ? 'border-blue-400/50' :
              phase === 'opening' ? 'border-purple-400/50' :
              'border-yellow-400/70'
            }`} style={{ animationDuration: '2s' }} />
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-500 ${
          phase === 'initial' ? 'bg-slate-700 text-slate-300' :
          phase === 'glowing' ? 'bg-blue-500/20 text-blue-400' :
          phase === 'opening' ? 'bg-purple-500/20 text-purple-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {phase === 'initial' && '🔐 Инициализация'}
          {phase === 'glowing' && '⚡ Зарядка энергии'}
          {phase === 'opening' && '🌟 Открытие'}
          {phase === 'complete' && '💥 Готово к извлечению!'}
        </div>
      </div>
    </div>
  );
};

export default Case3DOpening;
