
import { useState, useEffect } from "react";
import { Sparkles, Zap, Star } from "lucide-react";

const CaseOpeningPhase = () => {
  const [phase, setPhase] = useState<'sealed' | 'cracking' | 'exploding'>('sealed');
  const [cracks, setCracks] = useState<Array<{ id: number; x: number; y: number; rotation: number }>>([]);

  useEffect(() => {
    // Фаза 1: Запечатанный кейс (1 секунда)
    const timer1 = setTimeout(() => {
      setPhase('cracking');
      
      // Добавляем трещины постепенно
      const addCracks = () => {
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            setCracks(prev => [...prev, {
              id: i,
              x: Math.random() * 100,
              y: Math.random() * 100,
              rotation: Math.random() * 360
            }]);
          }, i * 200);
        }
      };
      addCracks();
    }, 1000);

    // Фаза 2: Взрыв (через 2.5 секунды)
    const timer2 = setTimeout(() => {
      setPhase('exploding');
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 relative overflow-hidden">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 text-center">
        {phase === 'sealed' && 'Активация кейса...'}
        {phase === 'cracking' && 'Энергия нарастает...'}
        {phase === 'exploding' && 'Кристальный взрыв!'}
      </h2>
      
      <div className="relative flex justify-center">
        {/* Основной кейс */}
        <div className={`relative w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 transition-all duration-1000 ${
          phase === 'exploding' ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
        }`}>
          {/* Кейс с градиентом */}
          <div className={`w-full h-full bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl md:text-6xl shadow-2xl relative overflow-hidden transition-all duration-500 ${
            phase === 'cracking' ? 'shadow-orange-500/50 animate-pulse' : 'shadow-slate-500/50'
          }`}>
            📦
            
            {/* Энергетические линии */}
            {phase === 'cracking' && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/30 to-transparent animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-400/20 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
              </>
            )}

            {/* Трещины */}
            {cracks.map((crack) => (
              <div
                key={crack.id}
                className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse"
                style={{
                  left: `${crack.x}%`,
                  top: `${crack.y}%`,
                  transform: `rotate(${crack.rotation}deg)`,
                  transformOrigin: 'center',
                  animationDelay: `${crack.id * 0.1}s`
                }}
              />
            ))}
          </div>

          {/* Энергетические кольца */}
          {phase === 'cracking' && (
            <>
              <div className="absolute inset-0 border-2 border-orange-400/50 rounded-full animate-ping" />
              <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-0 border-2 border-red-400/20 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
            </>
          )}
        </div>

        {/* Взрывные частицы */}
        {phase === 'exploding' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${50 + Math.cos(i * 30 * Math.PI / 180) * 100}%`,
                  top: `${50 + Math.sin(i * 30 * Math.PI / 180) * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Статус индикатор */}
      <div className="flex justify-center">
        <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-500 ${
          phase === 'sealed' ? 'bg-slate-700 text-slate-300' :
          phase === 'cracking' ? 'bg-orange-500/20 text-orange-400 animate-pulse' :
          'bg-yellow-500/20 text-yellow-400 animate-bounce'
        }`}>
          {phase === 'sealed' && '🔒 Сканирование...'}
          {phase === 'cracking' && '⚡ Разблокировка...'}
          {phase === 'exploding' && '💥 Извлечение!'}
        </div>
      </div>

      {/* Фоновые эффекты */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(phase === 'exploding' ? 30 : 15)].map((_, i) => (
          <div
            key={i}
            className={`absolute transition-all duration-1000 ${
              phase === 'exploding' ? 'animate-bounce' : 'animate-pulse'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`
            }}
          >
            {phase === 'sealed' && <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400/40" />}
            {phase === 'cracking' && <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400/60" />}
            {phase === 'exploding' && <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400/80" />}
          </div>
        ))}
      </div>

      {/* Энергетическая волна */}
      {phase === 'exploding' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 border-4 border-orange-400/30 rounded-full animate-ping" />
          <div className="absolute w-96 h-96 border-4 border-yellow-400/20 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
        </div>
      )}
    </div>
  );
};

export default CaseOpeningPhase;
