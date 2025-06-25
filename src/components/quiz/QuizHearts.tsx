import React from 'react';

const QuizHearts = ({ hearts }: { hearts: number }) => {
  return (
    <div className="flex justify-center mb-4">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`mx-1 text-2xl ${i < hearts ? 'text-red-500' : 'text-slate-600'}`}>❤️</span>
      ))}
    </div>
  );
};

export default QuizHearts; 