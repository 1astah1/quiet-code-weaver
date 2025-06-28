import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Gift, Coins } from 'lucide-react';

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
  const milestones = [4, 5, 10, 20, 30];
  const progress = (correctAnswers / 30) * 100;
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);

  const getMilestoneIcon = (milestone: number, isReached: boolean) => {
    const base = isReached ? 'animate-pulse animate-fadeIn' : '';
    switch (milestone) {
      case 5:
      case 10:
      case 20:
        return <Coins className={`w-4 h-4 text-yellow-500 ${base}`} />;
      case 30:
        return <Gift className={`w-4 h-4 text-purple-500 ${base}`} />;
      default:
        return <Trophy className={`w-4 h-4 text-blue-500 ${base}`} />;
    }
  };

  const getMilestoneReward = (milestone: number) => {
    switch (milestone) {
      case 5:
        return '+1';
      case 10:
        return '+4';
      case 20:
        return '+5';
      case 30:
        return '+10';
      default:
        return '';
    }
  };

  const getMilestoneTooltip = (milestone: number) => {
    switch (milestone) {
      case 5:
        return 'Награда: 1 монета';
      case 10:
        return 'Награда: 4 монеты';
      case 20:
        return 'Награда: 5 монет';
      case 30:
        return 'Суперприз!';
      default:
        return '';
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-300">
            Вопрос {currentQuestion}
          </span>
          <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
            {correctAnswers}/30
          </Badge>
        </div>
        <div className="text-sm font-medium text-slate-300">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out animate-fadeIn"
          style={{ width: `${progress}%` }}
        />
        
        {/* Milestone Markers */}
        {milestones.map((milestone) => {
          const milestoneProgress = (milestone / 30) * 100;
          const isReached = correctAnswers >= milestone;
          return (
            <div
              key={milestone}
              className="absolute top-0 bottom-0 flex items-center justify-center group"
              style={{ left: `${milestoneProgress}%` }}
              onMouseEnter={() => setHoveredMilestone(milestone)}
              onMouseLeave={() => setHoveredMilestone(null)}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                isReached 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/25 animate-pulse' 
                  : 'bg-slate-600/50 border border-slate-500/50'
              }`}>
                {getMilestoneIcon(milestone, isReached)}
              </div>
              {/* Tooltip */}
              {hoveredMilestone === milestone && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-md text-xs font-medium bg-black/90 text-white shadow-lg z-20 animate-fadeIn">
                  {getMilestoneTooltip(milestone)}
                </div>
              )}
              {/* Reward Label */}
              <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 ${
                isReached 
                  ? 'bg-gradient-to-r from-yellow-400/90 to-orange-500/90 text-white shadow-lg animate-fadeIn' 
                  : 'bg-slate-700/80 text-slate-400'
              }`}>
                {getMilestoneReward(milestone)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Milestone Legend */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Coins className="w-3 h-3 text-yellow-500" />
          <span>5 = +1</span>
        </div>
        <div className="flex items-center gap-1">
          <Coins className="w-3 h-3 text-yellow-500" />
          <span>10 = +4</span>
        </div>
        <div className="flex items-center gap-1">
          <Coins className="w-3 h-3 text-yellow-500" />
          <span>20 = +5</span>
        </div>
        <div className="flex items-center gap-1">
          <Gift className="w-3 h-3 text-purple-500" />
          <span>30 = +10</span>
        </div>
      </div>
    </Card>
  );
};

export default QuizProgressBar; 