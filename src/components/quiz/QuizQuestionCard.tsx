
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Target } from 'lucide-react';

interface QuizQuestionCardProps {
  question: {
    id: string;
    question: string;
    options: string[];
    correct_answer: string;
    image_url?: string;
  };
  questionNumber: number;
  onAnswer: (answer: string) => void;
  isAnswered: boolean;
  correctAnswer?: string;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  questionNumber,
  onAnswer,
  isAnswered,
  correctAnswer,
  selectedAnswer,
  isCorrect
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAnswerClick = (answer: string) => {
    if (isAnswered) return;
    
    setIsAnimating(true);
    onAnswer(answer);
    
    setTimeout(() => setIsAnimating(false), 1500);
  };

  const getButtonStyle = (answer: string) => {
    const baseStyle = "w-full h-14 sm:h-16 text-sm sm:text-lg font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg";
    
    if (!isAnswered) {
      return `${baseStyle} bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-xl`;
    }
    
    if (answer === correctAnswer) {
      return `${baseStyle} bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse shadow-green-500/25`;
    }
    
    if (answer === selectedAnswer && answer !== correctAnswer) {
      return `${baseStyle} bg-gradient-to-r from-red-500 to-pink-500 text-white animate-bounce shadow-red-500/25`;
    }
    
    return `${baseStyle} bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700/70`;
  };

  const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm relative">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Badge 
          variant="outline" 
          className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs sm:text-sm px-2 sm:px-3 py-1"
        >
          <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          Вопрос {questionNumber}
        </Badge>
        {isAnswered && (
          <div className="flex items-center gap-2 animate-fadeIn">
            {isCorrect ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            )}
            <span className={`text-xs sm:text-sm font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? 'Правильно!' : 'Неправильно'}
            </span>
          </div>
        )}
      </div>

      {/* Question Image */}
      {question.image_url && (
        <div className="mb-4 sm:mb-6 rounded-lg sm:rounded-xl overflow-hidden bg-slate-800/50">
          <img 
            src={question.image_url} 
            alt="Question" 
            className="w-full h-32 sm:h-48 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Question Text */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
          {question.question}
        </h3>
      </div>

      {/* Answer Options */}
      <div className="space-y-2 sm:space-y-3">
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant="ghost"
            className={getButtonStyle(option)}
            onClick={() => handleAnswerClick(option)}
            disabled={isAnswered}
          >
            <div className="flex items-center gap-2 sm:gap-3 w-full">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                {getOptionLetter(index)}
              </div>
              <span className="text-left flex-1 break-words">{option}</span>
            </div>
          </Button>
        ))}
      </div>

      {/* Feedback Animation Overlay */}
      {isAnimating && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-xl z-10 animate-fadeIn ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <div className={`text-4xl sm:text-6xl ${isCorrect ? 'text-green-400' : 'text-red-400'} ${isCorrect ? 'animate-bounce' : 'animate-pulse'}`}>
            {isCorrect ? (
              <CheckCircle className="w-16 h-16 sm:w-24 sm:h-24" />
            ) : (
              <XCircle className="w-16 h-16 sm:w-24 sm:h-24" />
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default QuizQuestionCard;
