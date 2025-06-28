import React from 'react';
import QuizHearts from './QuizHearts';
import QuizQuestionCard from './QuizQuestionCard';
import QuizRestoreModal from './QuizRestoreModal';
import QuizProgressBar from './QuizProgressBar';
import QuizRewardModal from './QuizRewardModal';
import { useQuiz } from '../../hooks/useQuiz';
import type { QuizQuestion } from '../../hooks/useQuiz';

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
    resetQuiz,
    questionsAnswered,
    correctAnswers,
    showReward,
    progressBar,
    setShowReward
  } = useQuiz();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black/90 px-2 py-8">
      <div className="w-full max-w-md mx-auto bg-slate-900 rounded-xl shadow-lg p-6 relative">
        <h1 className="text-3xl font-bold text-center text-white mb-4">Викторина</h1>
        
        {/* Полоса прогресса */}
        <QuizProgressBar 
          questionsAnswered={questionsAnswered}
          correctAnswers={correctAnswers}
          progressBar={progressBar}
        />
        
        {/* Сердца */}
        <QuizHearts hearts={hearts} />
        
        {/* Вопрос */}
        {canAnswer && currentQuestion && (
          <>
            <QuizQuestionCard 
              question={currentQuestion as QuizQuestion} 
              onAnswer={handleAnswer} 
              loading={loading} 
            />
            {errorMessage && (
              <div className="text-red-400 text-center font-semibold mt-2 animate-pulse">
                {errorMessage}
              </div>
            )}
          </>
        )}
        
        {/* Модальное окно восстановления */}
        {!canAnswer && (
          <QuizRestoreModal 
            isOpen={isRestoreModalOpen}
            onClose={closeRestoreModal}
            restoreTimeLeft={restoreTimeLeft}
            onWatchAd={handleWatchAd}
            loading={loading}
          />
        )}
        
        {/* Модальное окно награды */}
        <QuizRewardModal 
          reward={showReward}
          onClose={() => setShowReward(null)}
        />
        
        {/* Кнопка сброса */}
        <button 
          className="mt-4 text-xs text-orange-400 underline hover:text-orange-300 transition" 
          onClick={resetQuiz}
        >
          Сбросить викторину
        </button>
        
        {/* Статистика */}
        <div className="mt-4 text-center text-xs text-slate-400">
          <p>Отвечено вопросов: {questionsAnswered}</p>
          <p>Правильных ответов: {correctAnswers}</p>
          {questionsAnswered > 0 && (
            <p>Точность: {Math.round((correctAnswers / questionsAnswered) * 100)}%</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizScreen; 