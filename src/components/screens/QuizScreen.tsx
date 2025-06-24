import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/ui/use-translation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Trophy, Zap, Clock, Target, Award, Star, Flame } from "lucide-react";
import { useSecureQuiz } from "@/hooks/useSecureQuiz";
import { useSecureTaskProgress } from "@/hooks/useSecureTaskProgress";
import { QuizScreenProps, Question } from "@/types/quiz";
import QuizHeader from "@/components/quiz/QuizHeader";
import QuizProgress from "@/components/quiz/QuizProgress";
import QuizResultOverlay from "@/components/quiz/QuizResultOverlay";
import QuestionCard from "@/components/quiz/QuestionCard";
import { QuizBlocked, NoLives, QuizCompleted } from "@/components/quiz/QuizStates";

const QuizScreen = ({ currentUser, onCoinsUpdate, onBack, onLivesUpdate, onStreakUpdate }: QuizScreenProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(currentUser.lives);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation(currentUser.language_code);
  const { validateQuizAction } = useSecureQuiz();
  const { updateTaskProgress } = useSecureTaskProgress();

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['quiz-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('is_active', true)
        .limit(5);
      
      if (error) throw error;
      return data as Question[];
    }
  });

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Загрузка вопросов...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p>Вопросы не найдены</p>
          <Button onClick={onBack} className="mt-4">
            Назад
          </Button>
        </div>
      </div>
    );
  }

  if (lives === 0) {
    return (
      <NoLives
        nextLifeTime={quizLogic.nextLifeTime}
        canRestoreLife={quizLogic.canRestoreLife}
        onRestoreLife={quizLogic.handleRestoreLife}
        isRestoringLife={quizLogic.restoreLifeWithAdMutation.isPending}
        onBack={onBack}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-black px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <QuizHeader
          onBack={onBack}
          livesLeft={lives}
          streak={streak}
          canRestoreLife={quizLogic.canRestoreLife}
          onRestoreLife={quizLogic.handleRestoreLife}
          isRestoringLife={quizLogic.restoreLifeWithAdMutation.isPending}
          isProcessingAnswer={quizLogic.isProcessingAnswer}
        />

        <QuizProgress
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
        />

        <QuizResultOverlay
          showResult={showResult}
          lastAnswerCorrect={quizLogic.lastAnswerCorrect}
          livesLeft={lives}
        />

        <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={(answer) => {
            setSelectedAnswer(answer);
            setIsAnswered(true);
          }}
          showResult={showResult}
          isProcessingAnswer={quizLogic.isProcessingAnswer}
        />

        <Button
          onClick={() => {
            if (selectedAnswer !== null) {
              quizLogic.handleAnswerSelect(selectedAnswer);
              setIsAnswered(true);
            }
          }}
          disabled={!selectedAnswer || showResult || quizLogic.isProcessingAnswer}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-400 py-3 text-lg"
        >
          {quizLogic.isProcessingAnswer 
            ? 'Обработка...' 
            : currentQuestionIndex === questions.length - 1 
              ? 'Завершить викторину' 
              : 'Следующий вопрос'
          }
        </Button>
      </div>
    </div>
  );
};

export default QuizScreen;
