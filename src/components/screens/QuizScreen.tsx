
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { QuizScreenProps, Question } from "@/types/quiz";
import { useQuizLogic } from "@/hooks/useQuizLogic";
import QuizHeader from "@/components/quiz/QuizHeader";
import QuizProgress from "@/components/quiz/QuizProgress";
import QuizResultOverlay from "@/components/quiz/QuizResultOverlay";
import QuestionCard from "@/components/quiz/QuestionCard";
import { QuizBlocked, NoLives, QuizCompleted } from "@/components/quiz/QuizStates";

const QuizScreen = ({ currentUser, onCoinsUpdate, onBack, onLivesUpdate, onStreakUpdate }: QuizScreenProps) => {
  const { data: questions, isLoading } = useQuery({
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

  const quizLogic = useQuizLogic({
    currentUser,
    questions: questions || [],
    onCoinsUpdate,
    onBack,
    onLivesUpdate,
    onStreakUpdate
  });

  if (isLoading) {
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
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  if (quizLogic.quizBlocked) {
    return <QuizBlocked nextQuizTime={quizLogic.nextQuizTime} onBack={onBack} />;
  }

  if (quizLogic.livesLeft === 0) {
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

  if (quizLogic.quizCompleted) {
    return (
      <QuizCompleted
        correctAnswersCount={quizLogic.correctAnswersCount}
        totalQuestions={questions.length}
        livesLeft={quizLogic.livesLeft}
        onBack={onBack}
      />
    );
  }

  const currentQuestion = questions[quizLogic.currentQuestionIndex];

  return (
    <div className="min-h-screen bg-black px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <QuizHeader
          onBack={onBack}
          livesLeft={quizLogic.livesLeft}
          streak={currentUser.quiz_streak}
          canRestoreLife={quizLogic.canRestoreLife}
          onRestoreLife={quizLogic.handleRestoreLife}
          isRestoringLife={quizLogic.restoreLifeWithAdMutation.isPending}
          isProcessingAnswer={quizLogic.isProcessingAnswer}
        />

        <QuizProgress
          currentQuestionIndex={quizLogic.currentQuestionIndex}
          totalQuestions={questions.length}
        />

        <QuizResultOverlay
          showResult={quizLogic.showResult}
          lastAnswerCorrect={quizLogic.lastAnswerCorrect}
          livesLeft={quizLogic.livesLeft}
        />

        <QuestionCard
          question={currentQuestion}
          selectedAnswer={quizLogic.selectedAnswer}
          onAnswerSelect={quizLogic.handleAnswerSelect}
          showResult={quizLogic.showResult}
          isProcessingAnswer={quizLogic.isProcessingAnswer}
        />

        <Button
          onClick={quizLogic.handleNextQuestion}
          disabled={!quizLogic.selectedAnswer || quizLogic.showResult || quizLogic.isProcessingAnswer}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-400 py-3 text-lg"
        >
          {quizLogic.isProcessingAnswer 
            ? 'Обработка...' 
            : quizLogic.currentQuestionIndex === questions.length - 1 
              ? 'Завершить викторину' 
              : 'Следующий вопрос'
          }
        </Button>
      </div>
    </div>
  );
};

export default QuizScreen;
