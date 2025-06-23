
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, X } from 'lucide-react';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdWatched: () => void;
  caseName?: string;
}

const AdModal: React.FC<AdModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdWatched, 
  caseName 
}) => {
  const [adProgress, setAdProgress] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  // Симуляция просмотра рекламы (30 секунд)
  useEffect(() => {
    if (!isWatching) return;

    const interval = setInterval(() => {
      setAdProgress(prev => {
        const newProgress = prev + (100 / 30); // 30 секунд = 100%
        
        if (newProgress >= 50) {
          setCanSkip(true);
        }
        
        if (newProgress >= 100) {
          // Реклама закончилась
          setTimeout(() => {
            onAdWatched();
          }, 1000);
          return 100;
        }
        
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWatching, onAdWatched]);

  const handleStartAd = () => {
    setIsWatching(true);
    setAdProgress(0);
    setCanSkip(false);
  };

  const handleSkip = () => {
    if (canSkip) {
      onAdWatched();
    }
  };

  const handleClose = () => {
    setIsWatching(false);
    setAdProgress(0);
    setCanSkip(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            Просмотр рекламы
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isWatching ? (
            <div className="text-center space-y-4">
              <div className="text-slate-300">
                Для получения бесплатного кейса {caseName && `"${caseName}"`} необходимо посмотреть короткую рекламу
              </div>
              
              <Button 
                onClick={handleStartAd}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Начать просмотр рекламы
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                {adProgress < 100 ? (
                  <div className="text-center">
                    <div className="text-2xl mb-2">📺</div>
                    <div className="text-slate-300">Реклама воспроизводится...</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl mb-2 text-green-400">✅</div>
                    <div className="text-green-400">Реклама завершена!</div>
                  </div>
                )}
                
                {/* Прогресс-бар внизу */}
                <div className="absolute bottom-0 left-0 right-0 bg-slate-700 h-2">
                  <div 
                    className="h-full bg-green-500 transition-all duration-1000"
                    style={{ width: `${adProgress}%` }}
                  />
                </div>
                
                {/* Кнопка пропуска */}
                {canSkip && adProgress < 100 && (
                  <Button
                    onClick={handleSkip}
                    className="absolute top-2 right-2 bg-slate-700/80 hover:bg-slate-600/80 text-white text-xs px-2 py-1"
                    size="sm"
                  >
                    Пропустить
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>{Math.round(adProgress)}%</span>
                <span>{Math.max(0, 30 - Math.round(adProgress * 30 / 100))}с</span>
              </div>
              
              <Progress 
                value={adProgress} 
                className="w-full h-2"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdModal;
