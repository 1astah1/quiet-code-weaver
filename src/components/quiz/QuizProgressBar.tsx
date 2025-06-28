import React from 'react';

interface QuizProgressBarProps {
  questionsAnswered: number;
  correctAnswers: number;
  progressBar: number;
}

const QuizProgressBar = ({ questionsAnswered, correctAnswers, progressBar }: QuizProgressBarProps) => {
  const getProgressColor = () => {
    if (questionsAnswered >= 10) return 'bg-green-500';
    if (questionsAnswered >= 5) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getRewardText = () => {
    if (questionsAnswered >= 10) return 'Награда: 100 монет';
    if (questionsAnswered >= 5) return 'Награда: 30 монет';
    return 'Следующая награда: 30 монет (5 вопросов)';
  };

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="text-white text-sm font-semibold">
          Прогресс: {questionsAnswered}/10
        </div>
        <div className="text-white text-sm font-semibold">
          Правильно: {correctAnswers}
        </div>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${progressBar}%` }}
        />
      </div>
      
      <div className="text-center">
        <div className="text-orange-400 text-sm font-semibold">
          {getRewardText()}
        </div>
      </div>
      
      {/* Маркеры для наград */}
      <div className="flex justify-between mt-2">
        <div className="flex flex-col items-center">
          <div className={`w-2 h-2 rounded-full ${questionsAnswered >= 5 ? 'bg-yellow-400' : 'bg-slate-600'}`} />
          <div className="text-xs text-slate-400 mt-1">5</div>
        </div>
        <div className="flex flex-col items-center">
          <div className={`w-2 h-2 rounded-full ${questionsAnswered >= 10 ? 'bg-green-400' : 'bg-slate-600'}`} />
          <div className="text-xs text-slate-400 mt-1">10</div>
        </div>
      </div>
    </div>
  );
};

export default QuizProgressBar; 