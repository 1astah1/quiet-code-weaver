
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Target, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

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
        <Card className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <div className="p-4 sm:p-6 text-center">
            {/* Icon */}
            <div className="mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Нет жизней
            </h2>
            
            <p className="text-slate-300 mb-4 sm:mb-6 text-sm sm:text-base">
              У вас закончились жизни. Дождитесь восстановления или посмотрите рекламу.
            </p>

            {/* Timer */}
            {timeUntilNextHeart && timeUntilNextHeart > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  <span className="text-sm text-slate-300">Следующее сердце через:</span>
                </div>
                <div className="text-2xl sm:text-3xl font-mono text-orange-400 font-bold">
                  {formatTime(timeUntilNextHeart)}
                </div>
              </div>
            )}

            {/* Ad Button */}
            <div className="mb-4">
              {canWatchAd ? (
                <Button
                  onClick={onRestore}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Посмотреть рекламу
                </Button>
              ) : (
                <div className="w-full py-2 sm:py-3 rounded-xl bg-slate-700/50 text-slate-400 font-semibold border border-slate-600/50 flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Реклама недоступна
                </div>
              )}
            </div>

            {/* Close Button */}
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-slate-300 hover:text-white hover:bg-slate-800/50 py-2"
            >
              Закрыть
            </Button>

            {/* Info */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-400">Информация</span>
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
