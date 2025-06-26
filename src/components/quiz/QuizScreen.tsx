import React from 'react';
import QuizHearts from './QuizHearts';
import QuizQuestionCard, { QuizQuestion } from './QuizQuestionCard';
import QuizRestoreModal from './QuizRestoreModal';
import { useQuiz } from '../../hooks/useQuiz';
import { Progress } from '@/components/ui/progress';
import { Flame, Coins } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '../ui/skeleton';

const QuizScreen = () => {
  const {
    hearts,
    isRestoreModalOpen,
    currentQuestion,
    canAnswer,
    handleAnswer,
    handleWatchAd,
    restoreTimeLeft,
    closeRestoreModal,
    loading,
    errorMessage,
    quizProgress,
    streak,
    reward,
    resetQuiz,
  } = useQuiz();

  const progressValue = quizProgress.total > 0 ? (quizProgress.current / quizProgress.total) * 100 : 0;

  if (loading && !currentQuestion) {
    return (
        <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto bg-slate-800/50 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                <Skeleton className="h-8 w-2/3 mb-4" />
                <Skeleton className="h-2 w-full mb-4" />
                <div className="bg-slate-800 rounded-lg p-6 mb-4 shadow-lg w-full">
                    <Skeleton className="h-40 w-full rounded-md mb-4" />
                    <Skeleton className="h-8 w-3/4 mb-6" />
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md mx-auto bg-slate-800/50 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className='flex items-center gap-2'>
            <div className="text-sm font-bold text-orange-400 bg-slate-900/70 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              <span>Streak x{streak.toFixed(1)}</span>
            </div>
            <div className="text-sm font-bold text-yellow-400 bg-slate-900/70 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              <span>{reward}</span>
            </div>
          </div>
          <QuizHearts hearts={hearts} />
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-300 text-center mb-2">
            Вопрос {quizProgress.current > quizProgress.total ? quizProgress.total : quizProgress.current} из {quizProgress.total}
          </p>
          <Progress value={progressValue} className="w-full h-2 bg-slate-700" />
        </div>

        <AnimatePresence mode="wait">
          {canAnswer && currentQuestion ? (
            <QuizQuestionCard 
              key={currentQuestion.id}
              question={currentQuestion} 
              onAnswer={handleAnswer} 
              loading={loading} 
            />
          ) : (
            <motion.div
                key="quiz-ended"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center text-slate-300 py-20"
            >
              <h3 className="text-2xl font-bold text-white mb-2">
                {quizProgress.current > quizProgress.total ? "Викторина пройдена!" : "Время вышло!"}
              </h3>
              <p>{loading ? "Загрузка..." : "На сегодня все! Заходите завтра за новыми вопросами."}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {errorMessage && <div className="text-red-400 text-center font-semibold mt-2">{errorMessage}</div>}
        
        <QuizRestoreModal 
          isOpen={isRestoreModalOpen}
          onClose={closeRestoreModal}
          restoreTimeLeft={restoreTimeLeft}
          onWatchAd={handleWatchAd}
        />
        
        <button className="mt-4 text-xs text-orange-400 underline mx-auto block" onClick={resetQuiz}>
          Сбросить викторину (для теста)
        </button>
      </div>
    </div>
  );
};

export default QuizScreen; 