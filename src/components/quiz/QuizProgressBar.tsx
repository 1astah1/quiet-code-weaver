
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Coins, Brain } from 'lucide-react';

interface QuizProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  correctAnswers: number;
}

const QuizProgressBar: React.FC<QuizProgressBarProps> = ({
  currentQuestion,
  totalQuestions,
  correctAnswers
}) => {
  const milestones = [5, 10, 20, 30];
  const progress = (correctAnswers / 30) * 100;
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);

  const getMilestoneIcon = (milestone: number, isReached: boolean) => {
    const baseClasses = `w-3 h-3 sm:w-4 sm:h-4 ${isReached ? 'animate-pulse' : ''}`;
    
    if (milestone === 30) {
      return <Brain className={`${baseClasses} text-orange-500`} />;
    }
    return <Coins className={`${baseClasses} text-orange-500`} />;
  };

  const getMilestoneReward = (milestone: number) => {
    switch (milestone) {
      case 5: return '+1';
      case 10: return '+4';
      case 20: return '+5';
      case 30: return '+10';
      default: return '';
    }
  };

  const getMilestoneTooltip = (milestone: number) => {
    switch (milestone) {
      case 5: return 'Награда: 1 монета';
      case 10: return 'Награда: 4 монеты';
      case 20: return 'Награда: 5 монет';
      case 30: return 'Суперприз: 10 монет!';
      default: return '';
    }
  };

  return (
    <Card className="p-3 sm:p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-500" />
          <span className="text-xs sm:text-sm font-medium text-slate-300">
            Вопрос {currentQuestion}
          </span>
          <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 text-xs px-2 py-0.5">
            {correctAnswers}/30
          </Badge>
        </div>
        <div className="text-xs sm:text-sm font-medium text-slate-300">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="relative h-2 sm:h-3 bg-slate-800/60 rounded-full overflow-hidden mb-3 sm:mb-4">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-700 ease-out animate-fadeIn shadow-lg shadow-orange-500/25"
          style={{ width: `${progress}%` }}
        />
        
        {/* Milestone Markers */}
        {milestones.map((milestone) => {
          const milestoneProgress = (milestone / 30) * 100;
          const isReached = correctAnswers >= milestone;
          return (
            <div
              key={milestone}
              className="absolute top-0 bottom-0 flex items-center justify-center group cursor-pointer"
              style={{ left: `${milestoneProgress}%` }}
              onMouseEnter={() => setHoveredMilestone(milestone)}
              onMouseLeave={() => setHoveredMilestone(null)}
            >
              <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                isReached 
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-lg shadow-orange-500/30 animate-pulse' 
                  : 'bg-slate-600/60 border border-slate-500/50 hover:bg-slate-600/80'
              }`}>
                {getMilestoneIcon(milestone, isReached)}
              </div>
              
              {/* Tooltip */}
              {hoveredMilestone === milestone && (
                <div className="absolute -top-10 sm:-top-12 left-1/2 transform -translate-x-1/2 px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs font-medium bg-black/90 text-white shadow-lg z-20 animate-fadeIn whitespace-nowrap">
                  {getMilestoneTooltip(milestone)}
                </div>
              )}
              
              {/* Reward Label */}
              <div className={`absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs font-bold transition-all duration-300 ${
                isReached 
                  ? 'bg-gradient-to-r from-orange-400/90 to-orange-500/90 text-white shadow-lg animate-fadeIn' 
                  : 'bg-slate-700/80 text-slate-400'
              }`}>
                {getMilestoneReward(milestone)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Milestone Legend */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 text-xs text-slate-400">
        <div className="flex items-center justify-center gap-1">
          <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500" />
          <span className="text-xs">5=+1</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500" />
          <span className="text-xs">10=+4</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500" />
          <span className="text-xs">20=+5</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500" />
          <span className="text-xs">30=+10</span>
        </div>
      </div>
    </Card>
  );
};

export default QuizProgressBar;
