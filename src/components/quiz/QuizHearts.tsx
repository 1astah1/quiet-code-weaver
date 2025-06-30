import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, CheckCircle, XCircle, Clock } from 'lucide-react';

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
        isActive ? 'scale-100 opacity-100 animate-fadeIn' : 'scale-75 opacity-50'
      }`}
    >
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/25'
          : 'bg-slate-700/50 border border-slate-600/50'
      }`}>
        <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${
          isActive ? 'text-white' : 'text-slate-500'
        }`} />
      </div>
      {!isActive && index === hearts && timeUntilNextHeart && timeUntilNextHeart > 0 && (
        <div className="absolute inset-0 flex items-center justify-center animate-fadeIn">
          <Clock className="w-2 h-2 sm:w-3 sm:h-3 text-slate-400" />
        </div>
      )}
    </div>
  );

  return (
    <Card className="p-3 sm:p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Hearts Display */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-medium text-slate-300">
            Жизни:
          </span>
          <div className="flex items-center gap-1 sm:gap-2">
            {Array.from({ length: maxHearts }, (_, index) => 
              renderHeart(index, index < hearts)
            )}
          </div>
        </div>

        {/* Timer or Restore Button */}
        <div className="flex items-center gap-2">
          {timeUntilNextHeart && timeUntilNextHeart > 0 ? (
            <div className="flex items-center gap-1 sm:gap-2 animate-fadeIn">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
              <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 text-xs px-2 py-0.5">
                {formatTime(timeUntilNextHeart)}
              </Badge>
            </div>
          ) : hearts < maxHearts ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <Button
                onClick={onRestoreHeart}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs px-2 sm:px-3 py-1 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Восстановить
              </Button>
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
            <Button
              onClick={handleAdRestore}
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs px-2 sm:px-3 py-1 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Реклама
            </Button>
          </div>
        </div>
      )}

      {/* No Hearts Warning */}
      {hearts === 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="text-center">
            <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30 animate-fadeIn text-xs px-3 py-1">
              <XCircle className="w-3 h-3 mr-1" />
              Нет жизней! Дождитесь восстановления
            </Badge>
          </div>
        </div>
      )}

      {/* Ad Success Modal */}
      {showAdSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-black/70 absolute inset-0" />
          <div className="relative z-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 sm:p-6 shadow-2xl flex flex-col items-center border border-slate-700/50 max-w-sm w-full">
            <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-400 animate-bounce mb-2 sm:mb-3" />
            <div className="text-base sm:text-lg font-bold text-green-400 mb-1">Жизнь восстановлена!</div>
            <div className="text-slate-400 text-xs sm:text-sm text-center">Спасибо за просмотр рекламы</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default QuizHearts;
