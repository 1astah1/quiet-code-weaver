
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Trophy, Clock } from "lucide-react";

interface QuizStatesProps {
  onBack: () => void;
}

export const QuizBlocked = ({ nextQuizTime, onBack }: QuizStatesProps & { nextQuizTime: Date | null }) => {
  const formatTimeLeft = (targetTime: Date) => {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    
    if (diff <= 0) return "0:00";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-md w-full text-center border border-gray-700">
        <div className="mb-6">
          <Clock className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Викторина недоступна</h2>
          <p className="text-gray-400 mb-4">
            Вы уже проходили викторину сегодня
          </p>
          
          {nextQuizTime && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <p className="text-blue-400 font-medium">
                Следующая попытка через:
              </p>
              <p className="text-white text-xl font-bold">
                {formatTimeLeft(nextQuizTime)}
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            Приходите завтра за новыми вопросами!
          </p>
        </div>
        
        <Button onClick={onBack} variant="outline" className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
      </div>
    </div>
  );
};

export const NoLives = ({ 
  nextLifeTime, 
  canRestoreLife, 
  onRestoreLife, 
  isRestoringLife, 
  onBack 
}: QuizStatesProps & { 
  nextLifeTime: Date | null;
  canRestoreLife: boolean;
  onRestoreLife: () => void;
  isRestoringLife: boolean;
}) => {
  const formatTimeLeft = (targetTime: Date) => {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    
    if (diff <= 0) return "0:00";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-md w-full text-center border border-gray-700">
        <div className="mb-6">
          <Heart className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Жизни закончились</h2>
          <p className="text-gray-400 mb-4">
            {nextLifeTime 
              ? `Следующая жизнь через: ${formatTimeLeft(nextLifeTime)}`
              : "Жизни восстанавливаются каждые 8 часов"
            }
          </p>
          
          {canRestoreLife && (
            <Button
              onClick={onRestoreLife}
              disabled={isRestoringLife}
              className="w-full bg-green-500 hover:bg-green-600 mb-4"
            >
              {isRestoringLife ? 'Восстановление...' : 'Восстановить жизнь за рекламу'}
            </Button>
          )}
        </div>
        
        <Button onClick={onBack} variant="outline" className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
      </div>
    </div>
  );
};

export const QuizCompleted = ({ 
  correctAnswersCount, 
  totalQuestions, 
  livesLeft, 
  onBack 
}: QuizStatesProps & { 
  correctAnswersCount: number;
  totalQuestions: number;
  livesLeft: number;
}) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-md w-full text-center border border-gray-700">
        <div className="mb-6">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Викторина завершена!</h2>
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-lg">
              Правильных ответов: <span className="text-green-400 font-bold">{correctAnswersCount}</span> из <span className="text-blue-400 font-bold">{totalQuestions}</span>
            </p>
            <p className="text-gray-300 text-sm mt-2">
              Жизней осталось: <span className="text-red-400 font-bold">{livesLeft}</span>
            </p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-sm">
              🕐 Следующая попытка завтра
            </p>
          </div>
        </div>
        
        <Button onClick={onBack} className="w-full bg-orange-500 hover:bg-orange-600">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться
        </Button>
      </div>
    </div>
  );
};
