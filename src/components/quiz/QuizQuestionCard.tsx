import React from 'react';

const QuizQuestionCard = ({ question, onAnswer, loading }: { question: any, onAnswer: (answer: string) => void, loading: boolean }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-4 shadow">
      <div className="text-white text-lg font-semibold mb-2">{question.text}</div>
      <div className="flex flex-col gap-2">
        {question.answers.map((ans: string, idx: number) => (
          <button
            key={idx}
            className="w-full py-2 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold transition disabled:opacity-50"
            onClick={() => onAnswer(ans)}
            disabled={loading}
          >
            {ans}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizQuestionCard; 