import React from 'react';

interface QuizQuestion {
  text: string;
  answers: string[];
  correct: string;
  image_url?: string;
}

const QuizQuestionCard = ({ question, onAnswer, loading }: { question: QuizQuestion, onAnswer: (answer: string) => void, loading: boolean }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-4 shadow">
      {question.image_url && (
        <div className="flex justify-center mb-3">
          <img src={question.image_url} alt="quiz" className="max-h-40 rounded shadow" />
        </div>
      )}
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