import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import InstantImage from '../ui/InstantImage';

export interface QuizQuestion {
  id: string;
  question_text: string;
  image_url?: string;
  answers: { id: string; answer_text: string }[];
}

interface Props {
  question: QuizQuestion;
  onAnswer: (answerId: string) => void;
  loading: boolean;
}

const QuizQuestionCard = ({ question, onAnswer, loading }: Props) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleAnswerClick = (answerId: string) => {
    if (loading) return;
    setSelectedAnswer(answerId);
    // Даем время на анимацию перед вызовом onAnswer
    setTimeout(() => {
      onAnswer(answerId);
      setSelectedAnswer(null);
    }, 500);
  };

  if (loading && !question) {
    return (
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
    )
  }

  return (
    <motion.div 
      key={question.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-800 rounded-lg p-6 mb-4 shadow-lg w-full"
    >
      {question.image_url && (
        <div className="flex justify-center mb-6 rounded-md overflow-hidden relative aspect-video">
           <div className="absolute inset-0 bg-black/30 z-10" />
            <InstantImage 
              src={question.image_url} 
              alt="quiz content" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-800 to-transparent z-20" />
        </div>
      )}
      <h2 className="text-white text-xl font-bold mb-6 text-center -mt-10 z-30 relative">{question.question_text}</h2>
      <div className="flex flex-col gap-3">
        {question.answers.map((ans) => (
          <Button
            key={ans.id}
            variant={selectedAnswer === ans.id ? 'default' : 'secondary'}
            className="w-full py-6 text-lg rounded-lg font-bold transition-all duration-300 ease-in-out transform hover:scale-105"
            onClick={() => handleAnswerClick(ans.id)}
            disabled={loading || selectedAnswer !== null}
          >
            {ans.answer_text}
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuizQuestionCard; 