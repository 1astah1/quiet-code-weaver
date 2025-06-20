
import { useState, useEffect } from "react";

const Case3DOpening = () => {
  const [phase, setPhase] = useState<'sealed' | 'glowing' | 'cracking' | 'exploding'>('sealed');

  useEffect(() => {
    console.log('Case3DOpening mounted, starting animation');
    
    // Фаза 1: Запечатанный кейс (1 секунда)
    const timer1 = setTimeout(() => {
      console.log('Phase: glowing');
      setPhase('glowing');
    }, 1000);

    // Фаза 2: Свечение (1 секунда) 
    const timer2 = setTimeout(() => {
      console.log('Phase: cracking');
      setPhase('cracking');
    }, 2000);

    // Фаза 3: Трещины (1 секунда)
    const timer3 = setTimeout(() => {
      console.log('Phase: exploding');
      setPhase('exploding');
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  console.log('Case3DOpening render, phase:', phase);

  return (
    <div className="space-y-6 relative min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center animate-pulse">
        {phase === 'sealed' && 'Подготовка кейса...'}
        {phase === 'glowing' && 'Активация энергии...'}
        {phase === 'cracking' && 'Кейс раскрывается...'}
        {phase === 'exploding' && 'Магический взрыв!'}
      </h2>
      
      {/* Основной кейс */}
      <div className="relative">
        {/* Центральный кейс */}
        <div 
          className={`relative w-48 h-48 transition-all duration-1000 ${
            phase === 'sealed' ? 'scale-100 rotate-0' :
            phase === 'glowing' ? 'scale-110 rotate-12' :
            phase === 'cracking' ? 'scale-125 rotate-45' :
            'scale-150 rotate-180 opacity-50'
          }`}
        >
          <div className={`w-full h-full bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-3xl flex items-center justify-center text-8xl transition-all duration-500 border-4 ${
            phase === 'sealed' ? 'border-slate-500 shadow-lg' :
            phase === 'glowing' ? 'border-blue-500 shadow-blue-500/50 shadow-2xl' :
            phase === 'cracking' ? 'border-purple-500 shadow-purple-500/50 shadow-2xl' :
            'border-yellow-500 shadow-yellow-500/50 shadow-2xl'
          }`}>
            📦
            
            {/* Энергетические эффекты */}
            {phase !== 'sealed' && (
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <div className={`absolute inset-0 animate-pulse rounded-3xl ${
                  phase === 'glowing' ? 'bg-blue-500/20' :
                  phase === 'cracking' ? 'bg-purple-500/20' :
                  'bg-yellow-500/30'
                }`} />
              </div>
            )}
          </div>
        </div>

        {/* Энергетические кольца */}
        {phase !== 'sealed' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-64 h-64 border-2 rounded-full animate-spin ${
              phase === 'glowing' ? 'border-blue-400/50' :
              phase === 'cracking' ? 'border-purple-400/50' :
              'border-yellow-400/70'
            }`} style={{ animationDuration: '3s' }} />
            
            <div className={`absolute w-48 h-48 border-2 rounded-full animate-spin ${
              phase === 'glowing' ? 'border-blue-400/30' :
              phase === 'cracking' ? 'border-purple-400/30' :
              'border-yellow-400/50'
            }`} style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          </div>
        )}

        {/* Летающие частицы */}
        {phase === 'exploding' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-yellow-400 rounded-full animate-bounce"
                style={{
                  left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 100}%`,
                  top: `${50 + Math.sin(i * 45 * Math.PI / 180) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Статус */}
      <div className="flex justify-center">
        <div className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-500 ${
          phase === 'sealed' ? 'bg-slate-700 text-slate-300' :
          phase === 'glowing' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
          phase === 'cracking' ? 'bg-purple-500/20 text-purple-400 animate-pulse' :
          'bg-yellow-500/20 text-yellow-400 animate-bounce'
        }`}>
          {phase === 'sealed' && '🔐 Инициализация...'}
          {phase === 'glowing' && '⚡ Зарядка энергии...'}
          {phase === 'cracking' && '🌟 Открытие...'}
          {phase === 'exploding' && '💥 Извлечение!'}
        </div>
      </div>
    </div>
  );
};

export default Case3DOpening;
