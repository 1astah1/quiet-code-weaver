import React from 'react';
import QuizHearts from './QuizHearts';
import QuizQuestionCard from './QuizQuestionCard';
import QuizRestoreModal from './QuizRestoreModal';
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
  } = useQuiz();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black/90 px-2 py-8">
      <div className="w-full max-w-md mx-auto bg-slate-900 rounded-xl shadow-lg p-6 relative">
        <h1 className="text-3xl font-bold text-center text-white mb-4">Викторина</h1>
        <QuizHearts hearts={hearts} />
        {canAnswer && currentQuestion && (
          <>
            <QuizQuestionCard question={currentQuestion as QuizQuestion} onAnswer={handleAnswer} loading={loading} />
            {errorMessage && <div className="text-red-400 text-center font-semibold mt-2">{errorMessage}</div>}
          </>
        )}
        {!canAnswer && (
          <QuizRestoreModal 
            isOpen={isRestoreModalOpen}
            onClose={closeRestoreModal}
            restoreTimeLeft={restoreTimeLeft}
            onWatchAd={handleWatchAd}
          />
        )}
        <button className="mt-4 text-xs text-orange-400 underline" onClick={resetQuiz}>Сбросить викторину</button>
      </div>
    </div>
  );
};

export default QuizScreen; 