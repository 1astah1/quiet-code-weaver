import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, Zap } from 'lucide-react';

interface QuizHeartsProps {
  hearts: number;
  maxHearts: number;
  timeUntilNextHeart?: number;
  onRestoreHeart?: () => void;
  canRestoreWithAd?: boolean;
}

const QuizHearts: React.FC<QuizHeartsProps> = ({
  hearts,
  maxHearts,
  timeUntilNextHeart,
  onRestoreHeart,
  canRestoreWithAd
}) => {
  const [showAdSuccess, setShowAdSuccess] = useState(false);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAdRestore = () => {
    if (onRestoreHeart) {
      onRestoreHeart();
      setShowAdSuccess(true);
      setTimeout(() => setShowAdSuccess(false), 2000);
    }
  };

  const renderHeart = (index: number, isActive: boolean) => (
    <div
      key={index}
      className={`relative transition-all duration-500 ${
        isActive ? 'scale-100 opacity-100 animate-fadeIn' : 'scale-75 opacity-50 animate-fadeOut'
      }`}
    >
      <Heart
        className={`w-8 h-8 transition-all duration-300 ${
          isActive
            ? 'text-red-500 fill-red-500 drop-shadow-lg animate-pulse'
            : 'text-slate-600 fill-slate-600'
        }`}
      />
      {!isActive && index === hearts && timeUntilNextHeart && timeUntilNextHeart > 0 && (
        <div className="absolute inset-0 flex items-center justify-center animate-fadeIn">
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
      )}
    </div>
  );

  return (
    <Card className="p-4 bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Hearts Display */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-300 mr-2">
            Жизни:
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxHearts }, (_, index) => 
              renderHeart(index, index < hearts)
            )}
          </div>
        </div>

        {/* Timer or Restore Button */}
        <div className="flex items-center gap-2">
          {timeUntilNextHeart && timeUntilNextHeart > 0 ? (
            <div className="flex items-center gap-2 animate-fadeIn">
              <Clock className="w-4 h-4 text-slate-400 animate-pulse" />
              <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                {formatTime(timeUntilNextHeart)}
              </Badge>
            </div>
          ) : hearts < maxHearts ? (
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400 animate-pulse" />
              <Badge 
                variant="secondary" 
                className="bg-green-500/70 text-white border-green-500/30 cursor-pointer hover:bg-green-500/90 transition-colors animate-pulse"
                onClick={onRestoreHeart}
              >
                Восстановить
              </Badge>
            </div>
          ) : null}
        </div>
      </div>

      {/* Ad Restore Option */}
      {canRestoreWithAd && hearts < maxHearts && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Посмотрите рекламу для восстановления жизни
            </span>
            <Badge 
              variant="outline" 
              className="bg-blue-500/80 text-white border-blue-500/30 cursor-pointer hover:bg-blue-600/90 transition-colors text-xs animate-pulse shadow-lg"
              onClick={handleAdRestore}
            >
              <Zap className="w-3 h-3 mr-1 inline-block animate-bounce" /> Реклама
            </Badge>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {hearts === 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="text-center">
            <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30 animate-fadeIn">
              Нет жизней! Дождитесь восстановления или посмотрите рекламу
            </Badge>
          </div>
        </div>
      )}

      {/* Ad Success Modal */}
      {showAdSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-black/70 absolute inset-0" />
          <div className="relative z-10 bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center">
            <Heart className="w-12 h-12 text-red-500 animate-bounce mb-2" />
            <div className="text-lg font-bold text-green-600 mb-1">Жизнь восстановлена!</div>
            <div className="text-slate-600 text-sm">Спасибо за просмотр рекламы</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default QuizHearts; 