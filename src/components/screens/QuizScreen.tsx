
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Trophy, Target, Clock } from "lucide-react";
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
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [livesLeft, setLivesLeft] = useState(currentUser.quiz_lives);
  const [canRestoreLife, setCanRestoreLife] = useState(false);
  const [nextLifeTime, setNextLifeTime] = useState<Date | null>(null);
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

  // Проверяем время восстановления жизней
  useEffect(() => {
    const checkLifeRestoration = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('quiz_lives, last_life_restore, last_ad_life_restore')
          .eq('id', currentUser.id)
          .single();

        if (error) return;

        const now = new Date();
        const lastRestore = data.last_life_restore ? new Date(data.last_life_restore) : null;
        const lastAdRestore = data.last_ad_life_restore ? new Date(data.last_ad_life_restore) : null;

        // Проверяем восстановление жизней (1 жизнь каждые 4 часа)
        if (data.quiz_lives < 3 && lastRestore) {
          const fourHours = 4 * 60 * 60 * 1000;
          const timeSinceRestore = now.getTime() - lastRestore.getTime();
          const livesToRestore = Math.floor(timeSinceRestore / fourHours);

          if (livesToRestore > 0) {
            const newLives = Math.min(3, data.quiz_lives + livesToRestore);
            await supabase
              .from('users')
              .update({ 
                quiz_lives: newLives,
                last_life_restore: now.toISOString()
              })
              .eq('id', currentUser.id);

            setLivesLeft(newLives);
            onLivesUpdate(newLives);
          } else {
            // Вычисляем время до следующего восстановления
            const nextRestore = new Date(lastRestore.getTime() + fourHours);
            setNextLifeTime(nextRestore);
          }
        }

        // Проверяем возможность восстановления за рекламу (раз в 2 часа)
        if (lastAdRestore) {
          const twoHours = 2 * 60 * 60 * 1000;
          const timeSinceAdRestore = now.getTime() - lastAdRestore.getTime();
          setCanRestoreLife(timeSinceAdRestore >= twoHours && data.quiz_lives < 3);
        } else {
          setCanRestoreLife(data.quiz_lives < 3);
        }

        setLivesLeft(data.quiz_lives);
      } catch (error) {
        console.error('Error checking life restoration:', error);
      }
    };

    checkLifeRestoration();
    const interval = setInterval(checkLifeRestoration, 60000); // Проверяем каждую минуту

    return () => clearInterval(interval);
  }, [currentUser.id, onLivesUpdate]);

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

  const restoreLifeWithAdMutation = useMutation({
    mutationFn: async () => {
      const newLives = Math.min(3, livesLeft + 1);
      const { error } = await supabase
        .from('users')
        .update({ 
          quiz_lives: newLives,
          last_ad_life_restore: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      return newLives;
    },
    onSuccess: (newLives) => {
      setLivesLeft(newLives);
      onLivesUpdate(newLives);
      setCanRestoreLife(false);
      toast({
        title: "Жизнь восстановлена!",
        description: "Жизнь восстановлена за просмотр рекламы",
      });
    }
  });

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = async () => {
    if (!selectedAnswer || !questions) return;

    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    setLastAnswerCorrect(isCorrect);
    setShowResult(true);

    if (isCorrect) {
      setCorrectAnswersCount(prev => prev + 1);
    } else {
      // Неправильный ответ - отнимаем жизнь
      const newLives = Math.max(0, livesLeft - 1);
      setLivesLeft(newLives);
      
      try {
        await supabase
          .from('users')
          .update({ 
            quiz_lives: newLives,
            last_life_restore: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        onLivesUpdate(newLives);

        if (newLives === 0) {
          toast({
            title: "Жизни закончились!",
            description: "Приходите позже или восстановите жизнь за рекламу",
            variant: "destructive",
          });
          setTimeout(() => {
            onBack();
          }, 2000);
          return;
        }
      } catch (error) {
        console.error('Error updating lives:', error);
      }
    }

    // Продолжаем через 2 секунды
    setTimeout(() => {
      setShowResult(false);
      setLastAnswerCorrect(null);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer('');
      } else {
        // Завершение викторины
        const finalCorrectCount = isCorrect ? correctAnswersCount + 1 : correctAnswersCount;
        completeQuiz(finalCorrectCount, questions.length);
      }
    }, 2000);
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

    await updateUserStatsMutation.mutateAsync({
      lives: livesLeft,
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

  const handleRestoreLife = () => {
    // Здесь будет логика показа рекламы
    // Пока просто восстанавливаем жизнь
    restoreLifeWithAdMutation.mutate();
  };

  const formatTimeLeft = (targetTime: Date) => {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    
    if (diff <= 0) return "0:00";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
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

  if (livesLeft === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-md w-full text-center border border-gray-700">
          <div className="mb-6">
            <Heart className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Жизни закончились</h2>
            <p className="text-gray-400 mb-4">
              {nextLifeTime 
                ? `Следующая жизнь через: ${formatTimeLeft(nextLifeTime)}`
                : "Жизни восстанавливаются каждые 4 часа"
              }
            </p>
            
            {canRestoreLife && (
              <Button
                onClick={handleRestoreLife}
                disabled={restoreLifeWithAdMutation.isPending}
                className="w-full bg-green-500 hover:bg-green-600 mb-4"
              >
                {restoreLifeWithAdMutation.isPending ? 'Восстановление...' : 'Восстановить жизнь за рекламу'}
              </Button>
            )}
          </div>
          
          <Button onClick={onBack} variant="outline" className="w-full">
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
              <p className="text-gray-300 text-sm mt-2">
                Жизней осталось: <span className="text-red-400 font-bold">{livesLeft}</span>
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
              <span className="font-medium">{livesLeft}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-yellow-400">
              <Target className="w-5 h-5" />
              <span className="font-medium">{currentUser.quiz_streak}</span>
            </div>

            {canRestoreLife && (
              <Button
                onClick={handleRestoreLife}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-xs"
              >
                +❤️
              </Button>
            )}
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

        {/* Result overlay */}
        {showResult && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className={`text-6xl mb-4 ${lastAnswerCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {lastAnswerCorrect ? '✓' : '✗'}
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${lastAnswerCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {lastAnswerCorrect ? 'Правильно!' : 'Неправильно!'}
              </h3>
              {!lastAnswerCorrect && (
                <p className="text-gray-300">
                  Жизней осталось: {livesLeft}
                </p>
              )}
            </div>
          </div>
        )}

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
                  disabled={showResult}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === option
                      ? 'border-orange-500 bg-orange-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                  } ${showResult ? 'cursor-not-allowed opacity-50' : ''}`}
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
          disabled={!selectedAnswer || showResult}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-400 py-3 text-lg"
        >
          {currentQuestionIndex === questions.length - 1 ? 'Завершить викторину' : 'Следующий вопрос'}
        </Button>
      </div>
    </div>
  );
};

export default QuizScreen;
