
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Target } from "lucide-react";

interface QuizHeaderProps {
  onBack: () => void;
  livesLeft: number;
  streak: number;
  canRestoreLife: boolean;
  onRestoreLife: () => void;
  isRestoringLife: boolean;
  isProcessingAnswer: boolean;
}

const QuizHeader = ({
  onBack,
  livesLeft,
  streak,
  canRestoreLife,
  onRestoreLife,
  isRestoringLife,
  isProcessingAnswer
}: QuizHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="text-gray-400 hover:text-white"
        disabled={isProcessingAnswer}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </Button>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-red-400">
          <Heart className="w-5 h-5" />
          <span className="font-medium">{livesLeft}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-yellow-400">
          <Target className="w-5 h-5" />
          <span className="font-medium">{streak}</span>
        </div>

        {canRestoreLife && (
          <Button
            onClick={onRestoreLife}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-xs"
            disabled={isRestoringLife}
          >
            +❤️
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizHeader;
