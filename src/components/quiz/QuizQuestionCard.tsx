import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface QuizQuestionCardProps {
  question: {
    id: string;
    question: string;
    options: string[];
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
    
    // Reset animation after feedback
    setTimeout(() => setIsAnimating(false), 1500);
  };

  const getButtonVariant = (answer: string) => {
    if (!isAnswered) return 'default';
    
    if (answer === correctAnswer) {
      return 'success';
    }
    
    if (answer === selectedAnswer && answer !== correctAnswer) {
      return 'destructive';
    }
    
    return 'secondary';
  };

  const getButtonStyle = (answer: string) => {
    const baseStyle = "w-full h-16 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95";
    
    if (!isAnswered) {
      return `${baseStyle} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl`;
    }
    
    if (answer === correctAnswer) {
      return `${baseStyle} bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg animate-pulse`;
    }
    
    if (answer === selectedAnswer && answer !== correctAnswer) {
      return `${baseStyle} bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg`;
    }
    
    return `${baseStyle} bg-slate-700/50 text-slate-400 border border-slate-600/50`;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 backdrop-blur-sm">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
          Вопрос {questionNumber}
        </Badge>
        {isAnswered && (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-sm font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? 'Правильно!' : 'Неправильно'}
            </span>
          </div>
        )}
      </div>

      {/* Question Image */}
      {question.image_url && (
        <div className="mb-6 rounded-xl overflow-hidden bg-slate-800/50">
          <img 
            src={question.image_url} 
            alt="Question" 
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white leading-relaxed">
          {question.question}
        </h3>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant="ghost"
            className={getButtonStyle(option)}
            onClick={() => handleAnswerClick(option)}
            disabled={isAnswered}
          >
            <span className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {String.fromCharCode(65 + index)}
              </span>
              {option}
            </span>
          </Button>
        ))}
      </div>

      {/* Feedback Animation */}
      {isAnimating && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-xl ${
          isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          <div className={`text-6xl ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? '✓' : '✗'}
          </div>
        </div>
      )}
    </Card>
  );
};

export default QuizQuestionCard; 