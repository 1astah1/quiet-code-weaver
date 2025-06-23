
import { Question } from "@/types/quiz";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string;
  onAnswerSelect: (answer: string) => void;
  showResult: boolean;
  isProcessingAnswer: boolean;
}

const QuestionCard = ({ 
  question, 
  selectedAnswer, 
  onAnswerSelect, 
  showResult, 
  isProcessingAnswer 
}: QuestionCardProps) => {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
      {question.image_url && (
        <div className="mb-6">
          <img
            src={question.image_url}
            alt="Question"
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <h2 className="text-xl font-bold text-white mb-6 leading-relaxed">
        {question.question}
      </h2>
      
      <div className="space-y-3">
        {['A', 'B', 'C', 'D'].map((option) => {
          const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;
          return (
            <button
              key={option}
              onClick={() => onAnswerSelect(option)}
              disabled={showResult || isProcessingAnswer}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedAnswer === option
                  ? 'border-orange-500 bg-orange-500/20 text-white'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
              } ${(showResult || isProcessingAnswer) ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <span className="font-medium mr-3">{option}.</span>
              {optionText}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
