import React, { useState } from 'react';
import type { QuizQuestion } from '../../hooks/useQuiz';

interface QuizQuestionCardProps {
  question: QuizQuestion;
  onAnswer: (answer: string) => void;
  loading: boolean;
}

const QuizQuestionCard = ({ question, onAnswer, loading }: QuizQuestionCardProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleAnswerClick = async (answer: string) => {
    if (loading || selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    setIsCorrect(answer === question.correct_answer);
    setShowResult(true);
    
    // Небольшая задержка для показа результата
    setTimeout(() => {
      onAnswer(answer);
      setSelectedAnswer(null);
      setShowResult(false);
    }, 1500);
  };

  const getButtonClass = (answer: string) => {
    if (!showResult) {
      return "w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed";
    }
    
    if (answer === question.correct_answer) {
      return "w-full py-3 rounded-lg bg-green-500 text-white font-bold transition";
    }
    
    if (answer === selectedAnswer && answer !== question.correct_answer) {
      return "w-full py-3 rounded-lg bg-red-500 text-white font-bold transition";
    }
    
    return "w-full py-3 rounded-lg bg-slate-600 text-slate-300 font-bold transition";
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-4 shadow-lg">
      {question.image_url && (
        <div className="flex justify-center mb-4">
          <img src={question.image_url} alt="quiz" className="max-h-40 rounded shadow" />
        </div>
      )}
      <div className="text-white text-lg font-semibold mb-4 text-center">{question.text}</div>
      <div className="flex flex-col gap-3">
        {question.answers.map((answer: string, idx: number) => (
          <button
            key={idx}
            className={getButtonClass(answer)}
            onClick={() => handleAnswerClick(answer)}
            disabled={loading || selectedAnswer !== null}
          >
            {answer}
            {showResult && answer === question.correct_answer && (
              <span className="ml-2">✓</span>
            )}
            {showResult && answer === selectedAnswer && answer !== question.correct_answer && (
              <span className="ml-2">✗</span>
            )}
          </button>
        ))}
      </div>
      {showResult && (
        <div className={`mt-4 text-center font-bold text-lg ${
          isCorrect ? 'text-green-400' : 'text-red-400'
        }`}>
          {isCorrect ? 'Правильно! 🎉' : 'Неправильно! 😔'}
        </div>
      )}
    </div>
  );
};

export default QuizQuestionCard; 