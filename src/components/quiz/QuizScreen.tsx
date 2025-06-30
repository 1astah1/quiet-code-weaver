
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, AlertTriangle } from 'lucide-react';
import QuizProgressBar from './QuizProgressBar';
import QuizQuestionCard from './QuizQuestionCard';
import QuizHearts from './QuizHearts';
import QuizRewardModal from './QuizRewardModal';
import QuizRestoreModal from './QuizRestoreModal';
import { useQuiz } from '@/hooks/useQuiz';

interface QuizScreenProps {
  onBack: () => void;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ onBack }) => {
  const {
    currentQuestion,
    questionsAnswered,
    correctAnswers,
    hearts,
    timeUntilNextHeart,
    loading,
    error,
    answerQuestion,
    restoreHeart,
    canRestoreWithAd,
    reward,
    clearReward
  } = useQuiz();

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(undefined);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleAnswer = async (answer: string) => {
    if (loading || hearts === 0) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const correct = await answerQuestion(answer);
    setIsCorrect(correct);
    
    // Reset after showing feedback
    setTimeout(() => {
      setIsAnswered(false);
      setSelectedAnswer(undefined);
    }, 1500);
  };

  const handleRestoreHeart = () => {
    if (canRestoreWithAd) {
      setShowRestoreModal(true);
    } else {
      restoreHeart();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Ошибка загрузки</h2>
          <p className="text-slate-300 mb-6 text-sm sm:text-base">{error}</p>
          <Button 
            onClick={onBack} 
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-slate-800/50 p-2 sm:p-3"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            <span className="text-base sm:text-lg font-bold text-white">Викторина</span>
          </div>
          
          <div className="w-10 sm:w-12" />
        </div>

        {/* Progress Bar */}
        <QuizProgressBar
          currentQuestion={questionsAnswered + 1}
          totalQuestions={30}
          correctAnswers={correctAnswers}
        />
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 pb-4">
        {loading ? (
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-slate-300 text-sm sm:text-base">Загрузка вопроса...</p>
          </Card>
        ) : currentQuestion ? (
          <QuizQuestionCard
            question={currentQuestion}
            questionNumber={questionsAnswered + 1}
            onAnswer={handleAnswer}
            isAnswered={isAnswered}
            correctAnswer={currentQuestion.correct_answer}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
          />
        ) : (
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm text-center">
            <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Викторина завершена!</h2>
            <p className="text-slate-300 mb-6 text-sm sm:text-base">
              Вы ответили на {questionsAnswered} вопросов и получили {correctAnswers} правильных ответов!
            </p>
            <Button 
              onClick={onBack} 
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Вернуться в меню
            </Button>
          </Card>
        )}
      </div>

      {/* Hearts */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <QuizHearts
          hearts={hearts}
          maxHearts={2}
          timeUntilNextHeart={timeUntilNextHeart}
          onRestoreHeart={handleRestoreHeart}
          canRestoreWithAd={canRestoreWithAd}
        />
      </div>

      {/* Reward Modal */}
      {reward && (
        <QuizRewardModal
          isOpen={!!reward}
          onClose={clearReward}
          reward={reward}
        />
      )}

      {/* Restore Modal */}
      <QuizRestoreModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onRestore={restoreHeart}
        timeUntilNextHeart={timeUntilNextHeart}
      />
    </div>
  );
};

export default QuizScreen;
