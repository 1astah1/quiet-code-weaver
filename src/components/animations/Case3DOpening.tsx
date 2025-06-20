
import { useState, useEffect } from "react";

const Case3DOpening = () => {
  const [phase, setPhase] = useState<'sealed' | 'activating' | 'opening' | 'exploding'>('sealed');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Фаза 1: Запечатанный кейс (1 секунда)
    const timer1 = setTimeout(() => {
      setPhase('activating');
    }, 1000);

    // Фаза 2: Активация (1 секунда)
    const timer2 = setTimeout(() => {
      setPhase('opening');
      // Создаем частицы
      const newParticles = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 2
        });
      }
      setParticles(newParticles);
    }, 2000);

    // Фаза 3: Взрыв (1 секунда)
    const timer3 = setTimeout(() => {
      setPhase('exploding');
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 relative overflow-hidden min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 text-center z-10">
        {phase === 'sealed' && 'Инициализация кейса...'}
        {phase === 'activating' && 'Активация магии...'}
        {phase === 'opening' && 'Кейс раскрывается...'}
        {phase === 'exploding' && 'Магический взрыв!'}
      </h2>
      
      {/* Основная 3D сцена */}
      <div className="relative perspective-1000">
        {/* 3D кейс */}
        <div 
          className={`relative w-32 sm:w-48 md:w-56 h-32 sm:h-48 md:h-56 transition-all duration-1000 transform-style-preserve-3d ${
            phase === 'sealed' ? 'rotate-0' :
            phase === 'activating' ? 'rotate-y-12 scale-110' :
            phase === 'opening' ? 'rotate-y-45 scale-125' :
            'rotate-y-180 scale-150 opacity-30'
          }`}
        >
          {/* Передняя грань */}
          <div className={`absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-2xl flex items-center justify-center text-6xl sm:text-8xl shadow-2xl border-4 transition-all duration-500 ${
            phase === 'activating' ? 'border-blue-500 shadow-blue-500/50' :
            phase === 'opening' ? 'border-purple-500 shadow-purple-500/50' :
            phase === 'exploding' ? 'border-yellow-500 shadow-yellow-500/50' :
            'border-slate-500'
          }`}>
            📦
            
            {/* Энергетические волны */}
            {phase !== 'sealed' && (
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse ${
                  phase === 'activating' ? 'bg-blue-500/10' :
                  phase === 'opening' ? 'bg-purple-500/10' :
                  'bg-yellow-500/20'
                }`} />
              </div>
            )}
          </div>

          {/* Боковые грани для 3D эффекта */}
          <div className="absolute top-0 left-full w-8 h-full bg-gradient-to-r from-slate-700 to-slate-800 transform origin-left rotate-y-90 rounded-r-2xl" />
          <div className="absolute top-full left-0 w-full h-8 bg-gradient-to-b from-slate-700 to-slate-900 transform origin-top rotate-x-90 rounded-b-2xl" />
        </div>

        {/* Орбитальные кристаллы */}
        {phase !== 'sealed' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-4 h-4 sm:w-6 sm:h-6 rounded-full transition-all duration-1000 ${
                  phase === 'activating' ? 'bg-blue-400 shadow-blue-400/50' :
                  phase === 'opening' ? 'bg-purple-400 shadow-purple-400/50' :
                  'bg-yellow-400 shadow-yellow-400/50'
                } shadow-lg animate-pulse`}
                style={{
                  left: `${50 + Math.cos(i * 60 * Math.PI / 180) * (phase === 'exploding' ? 150 : 80)}%`,
                  top: `${50 + Math.sin(i * 60 * Math.PI / 180) * (phase === 'exploding' ? 150 : 80)}%`,
                  animationDelay: `${i * 0.2}s`,
                  transform: 'translate(-50%, -50%)',
                  opacity: phase === 'exploding' ? 0.3 : 1
                }}
              />
            ))}
          </div>
        )}

        {/* Магические круги */}
        {phase !== 'sealed' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-40 sm:w-60 md:w-72 h-40 sm:h-60 md:h-72 border-2 rounded-full animate-spin transition-all duration-1000 ${
              phase === 'activating' ? 'border-blue-400/50' :
              phase === 'opening' ? 'border-purple-400/50' :
              'border-yellow-400/70'
            }`} style={{ animationDuration: '3s' }} />
            
            <div className={`absolute w-32 sm:w-48 md:w-56 h-32 sm:h-48 md:h-56 border-2 rounded-full animate-spin transition-all duration-1000 ${
              phase === 'activating' ? 'border-blue-400/30' :
              phase === 'opening' ? 'border-purple-400/30' :
              'border-yellow-400/50'
            }`} style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          </div>
        )}

        {/* Энергетические вспышки */}
        {phase === 'exploding' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-16 sm:w-3 sm:h-24 bg-gradient-to-t from-transparent via-yellow-400 to-transparent animate-ping"
                style={{
                  left: `${50 + Math.cos(i * 30 * Math.PI / 180) * 120}%`,
                  top: `${50 + Math.sin(i * 30 * Math.PI / 180) * 120}%`,
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.5s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Плавающие частицы */}
      {particles.length > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className={`absolute w-1 h-1 sm:w-2 sm:h-2 rounded-full transition-all duration-2000 ${
                phase === 'opening' ? 'bg-purple-400' : 'bg-yellow-400'
              } animate-bounce`}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      )}

      {/* Статус индикатор */}
      <div className="flex justify-center z-10">
        <div className={`px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-500 ${
          phase === 'sealed' ? 'bg-slate-700 text-slate-300' :
          phase === 'activating' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
          phase === 'opening' ? 'bg-purple-500/20 text-purple-400 animate-pulse' :
          'bg-yellow-500/20 text-yellow-400 animate-bounce'
        }`}>
          {phase === 'sealed' && '🔐 Сканирование...'}
          {phase === 'activating' && '⚡ Зарядка магии...'}
          {phase === 'opening' && '🌟 Раскрытие...'}
          {phase === 'exploding' && '💥 Извлечение!'}
        </div>
      </div>

      {/* Фоновая магическая аура */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-radial transition-all duration-2000 ${
          phase === 'sealed' ? 'from-transparent to-transparent' :
          phase === 'activating' ? 'from-blue-500/5 via-blue-500/2 to-transparent' :
          phase === 'opening' ? 'from-purple-500/10 via-purple-500/3 to-transparent' :
          'from-yellow-500/15 via-yellow-500/5 to-transparent'
        }`} />
      </div>
    </div>
  );
};

export default Case3DOpening;
