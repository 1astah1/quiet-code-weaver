
import { useState, useEffect } from "react";

const Case3DOpening = () => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 2);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl">
      <div className="relative">
        {/* 3D Кейс */}
        <div 
          className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-2xl transform transition-transform duration-100"
          style={{ 
            transform: `rotateY(${rotation}deg) rotateX(10deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Передняя грань */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
            <div className="text-white text-2xl font-bold">CS2</div>
          </div>
          
          {/* Боковые грани для 3D эффекта */}
          <div 
            className="absolute top-0 right-0 w-4 h-full bg-gradient-to-r from-red-600 to-red-700 rounded-r-lg"
            style={{ transform: 'rotateY(90deg) translateZ(64px)' }}
          />
          <div 
            className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-t-lg"
            style={{ transform: 'rotateX(90deg) translateZ(64px)' }}
          />
        </div>

        {/* Эффект свечения */}
        <div className="absolute inset-0 bg-orange-500/20 rounded-lg blur-xl animate-pulse" />
        
        {/* Частицы */}
        <div className="absolute -inset-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-orange-400 rounded-full animate-ping"
              style={{
                left: `${20 + i * 10}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Текст загрузки */}
      <div className="absolute bottom-8 text-white text-center">
        <div className="text-lg font-semibold mb-2">Открытие кейса...</div>
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Case3DOpening;
