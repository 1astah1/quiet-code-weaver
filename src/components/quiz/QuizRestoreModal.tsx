import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, Clock, Play, Info } from 'lucide-react';

interface QuizRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  timeUntilNextHeart?: number;
}

const QuizRestoreModal: React.FC<QuizRestoreModalProps> = ({
  isOpen,
  onClose,
  onRestore,
  timeUntilNextHeart
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const canWatchAd = !timeUntilNextHeart || timeUntilNextHeart === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent">
        <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <div className="p-6 text-center">
            {/* Icon */}
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 flex items-center justify-center">
                <Heart className="w-8 h-8 text-red-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2">
              Нет жизней
            </h2>
            
            <p className="text-slate-300 mb-6">
              У вас закончились жизни. Дождитесь восстановления или посмотрите рекламу.
            </p>

            {/* Timer */}
            {timeUntilNextHeart && timeUntilNextHeart > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-slate-300">Следующее сердце через:</span>
                </div>
                <div className="text-3xl font-mono text-orange-400 font-bold">
                  {formatTime(timeUntilNextHeart)}
                </div>
              </div>
            )}

            {/* Ad Button */}
            <div className="mb-4">
              {canWatchAd ? (
                <Button
                  onClick={onRestore}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Посмотреть рекламу
                </Button>
              ) : (
                <div className="w-full py-3 rounded-xl bg-slate-700/50 text-slate-400 font-semibold border border-slate-600/50">
                  <Clock className="w-5 h-5 inline mr-2" />
                  Реклама недоступна
                </div>
              )}
            </div>

            {/* Close Button */}
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-slate-300 hover:text-white hover:bg-slate-800/50"
            >
              Закрыть
            </Button>

            {/* Info */}
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Информация</span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <p>• Сердце восстанавливается каждые 8 часов</p>
                <p>• Реклама доступна раз в 8 часов</p>
                <p>• Максимум 2 сердца</p>
              </div>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default QuizRestoreModal; 