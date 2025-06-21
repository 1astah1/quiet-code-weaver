
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Trophy, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    quiz_lives: number;
    quiz_streak: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
  onBack: () => void;
  onLivesUpdate: (newLives: number) => void;
  onStreakUpdate: (newStreak: number) => void;
}

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  image_url?: string;
}

const QuizScreen = ({ currentUser, onCoinsUpdate, onBack, onLivesUpdate, onStreakUpdate }: QuizScreenProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const updateUserStatsMutation = useMutation({
    mutationFn: async ({ lives, streak, coins }: { lives: number; streak: number; coins: number }) => {
      const { error } = await supabase
        .from('users')
        .update({ 
          quiz_lives: lives, 
          quiz_streak: streak, 
          coins: coins,
          last_quiz_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', currentUser.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      onLivesUpdate(variables.lives);
      onStreakUpdate(variables.streak);
      onCoinsUpdate(variables.coins);
      queryClient.invalidateQueries({ queryKey: ['user-data'] });
    }
  });

  const saveQuizProgressMutation = useMutation({
    mutationFn: async ({ questionsAnswered, correctAnswers, completed }: { questionsAnswered: number; correctAnswers: number; completed: boolean }) => {
      const { error } = await supabase
        .from('user_quiz_progress')
        .upsert({
          user_id: currentUser.id,
          questions_answered: questionsAnswered,
          correct_answers: correctAnswers,
          date: new Date().toISOString().split('T')[0],
          completed: completed
        });

      if (error) throw error;
    }
  });

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) return;

    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);

    const currentQuestion = questions![currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setCorrectAnswersCount(prev => prev + 1);
    }

    if (currentQuestionIndex < questions!.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      // Завершение викторины
      const finalCorrectCount = isCorrect ? correctAnswersCount + 1 : correctAnswersCount;
      completeQuiz(finalCorrectCount, questions!.length);
    }
  };

  const completeQuiz = async (correctCount: number, totalQuestions: number) => {
    setQuizCompleted(true);
    
    let newStreak = currentUser.quiz_streak;
    let coinsEarned = 0;
    
    if (correctCount >= 3) {
      newStreak += 1;
      coinsEarned = 25 + (newStreak * 5);
    } else {
      newStreak = 0;
    }

    const newCoins = currentUser.coins + coinsEarned;

    await saveQuizProgressMutation.mutateAsync({
      questionsAnswered: totalQuestions,
      correctAnswers: correctCount,
      completed: true
    });

    await updateUserStatsMutation.mutateAsync({
      lives: currentUser.quiz_lives,
      streak: newStreak,
      coins: newCoins
    });

    if (correctCount >= 3) {
      toast({
        title: "Викторина завершена!",
        description: `Получено ${coinsEarned} монет. Серия: ${newStreak}`,
      });
    } else {
      toast({
        title: "Викторина завершена",
        description: "Нужно минимум 3 правильных ответа для получения награды",
        variant: "destructive",
      });
    }
  };

  const handleWrongAnswer = async () => {
    const newLives = Math.max(0, currentUser.quiz_lives - 1);
    
    await updateUserStatsMutation.mutateAsync({
      lives: newLives,
      streak: 0,
      coins: currentUser.coins
    });

    toast({
      title: "Неправильный ответ!",
      description: `Осталось жизней: ${newLives}`,
      variant: "destructive",
    });

    if (newLives === 0) {
      toast({
        title: "Жизни закончились!",
        description: "Приходите завтра за новыми жизнями",
        variant: "destructive",
      });
      onBack();
    }
  };

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

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-md w-full text-center border border-gray-700">
          <div className="mb-6">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Викторина завершена!</h2>
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-gray-300 text-lg">
                Правильных ответов: <span className="text-green-400 font-bold">{correctAnswersCount}</span> из <span className="text-blue-400 font-bold">{questions.length}</span>
              </p>
            </div>
          </div>
          
          <Button onClick={onBack} className="w-full bg-orange-500 hover:bg-orange-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-black px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-red-400">
              <Heart className="w-5 h-5" />
              <span className="font-medium">{currentUser.quiz_lives}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-yellow-400">
              <Target className="w-5 h-5" />
              <span className="font-medium">{currentUser.quiz_streak}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
          {currentQuestion.image_url && (
            <div className="mb-6">
              <img
                src={currentQuestion.image_url}
                alt="Question"
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <h2 className="text-xl font-bold text-white mb-6 leading-relaxed">
            {currentQuestion.question}
          </h2>
          
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option) => {
              const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
              return (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === option
                      ? 'border-orange-500 bg-orange-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                  }`}
                >
                  <span className="font-medium mr-3">{option}.</span>
                  {optionText}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-400 py-3 text-lg"
        >
          {currentQuestionIndex === questions.length - 1 ? 'Завершить викторину' : 'Следующий вопрос'}
        </Button>
      </div>
    </div>
  );
};

export default QuizScreen;
