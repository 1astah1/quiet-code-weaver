
interface QuizProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
}

const QuizProgress = ({ currentQuestionIndex, totalQuestions }: QuizProgressProps) => {
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>Вопрос {currentQuestionIndex + 1} из {totalQuestions}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default QuizProgress;
