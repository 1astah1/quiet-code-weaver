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
  const [lives, setLives] = useState(currentUser.quiz_lives);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('ru');

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p>Нет жизней</p>
          <Button onClick={onBack} className="mt-4">
            Назад
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-black px-2 sm:px-4 md:px-6 py-3 sm:py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Button onClick={onBack} variant="outline" className="mb-4">
            Назад
          </Button>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-white">{lives}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-white">{streak}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
          </div>
          <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">{currentQuestion.question}</h3>
            <div className="space-y-2">
              {['A', 'B', 'C', 'D'].map((option, index) => (
                <button
                  key={option}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full p-3 text-left rounded-lg border transition-all text-sm sm:text-base font-medium ${
                    selectedAnswer === index
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                  }`}
                >
                  <span className="font-medium mr-2">{option}.</span> {currentQuestion[`option_${option.toLowerCase()}` as keyof Question]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => {
            if (selectedAnswer !== null) {
              // Здесь должна быть логика обработки ответа
              console.log('Ответ выбран:', selectedAnswer);
            }
          }}
          disabled={selectedAnswer === null}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-400 py-2.5 sm:py-3 text-sm sm:text-lg font-medium"
        >
          {currentQuestionIndex === questions.length - 1 ? 'Завершить викторину' : 'Следующий вопрос'}
        </Button>
      </div>
    </div>
  );
};

export default QuizScreen;
