import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Brain, Check } from 'lucide-react';

interface QuizProgressBarProps {
  correctAnswers: number;
}

const QuizProgressBar: React.FC<QuizProgressBarProps> = ({
  correctAnswers
}) => {
  const milestones = [
    { questions: 5, reward: 4 },
    { questions: 10, reward: 8 },
    { questions: 20, reward: 16 },
    { questions: 30, reward: 32 },
  ];
  const totalQuestions = 30;
  const progress = (correctAnswers / totalQuestions) * 100;

  const getMilestoneIcon = (questions: number) => {
    if (questions === 30) {
      return <Brain className="w-4 h-4 text-white" />;
    }
    return <Coins className="w-4 h-4 text-white" />;
  };

  return (
    <Card className="p-3 sm:p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">
          Прогресс наград
        </span>
        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 text-xs px-2 py-0.5">
          {correctAnswers}/{totalQuestions} правильных
        </Badge>
      </div>

      {/* Rewards Row */}
      <div className="relative mb-4 h-12">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700" />
        <div className="flex justify-between items-center absolute top-1/2 -translate-y-1/2 w-full">
          {milestones.map((milestone) => {
            const isReached = correctAnswers >= milestone.questions;
            return (
              <div key={milestone.questions} className="relative flex flex-col items-center">
                {/* Reward Label */}
                <div className={`absolute -top-7 text-xs font-bold px-2 py-1 rounded-md transition-all duration-300 ${
                  isReached
                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  +{milestone.reward}
                </div>
                {/* Milestone Marker */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                    isReached
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-lg shadow-orange-500/30'
                      : 'bg-slate-600 border border-slate-500'
                  }`}>
                    {isReached ? <Check className="w-4 h-4 text-white" /> : getMilestoneIcon(milestone.questions)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="relative h-3 bg-slate-800/60 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Card>
  );
};

export default QuizProgressBar;
