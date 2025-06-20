
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateUUID, isValidUUID } from "@/utils/uuid";
import { ArrowLeft, Heart, Trophy, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    quiz_lives: number;
    quiz_streak: number;
  };
  onBack: () => void;
  onCoinsUpdate: (newCoins: number) => void;
  onLivesUpdate: (newLives: number) => void;
  onStreakUpdate: (newStreak: number) => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  image_url: string | null;
  category: string;
}

const QuizScreen = ({ 
  currentUser, 
  onBack, 
  onCoinsUpdate, 
  onLivesUpdate, 
  onStreakUpdate 
}: QuizScreenProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загружаем вопросы
  const { data: questions, isLoading } = useQuery({
    queryKey: ['quiz-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('is_active', true)
        .order('id');
      
      if (error) throw error;
      return data as QuizQuestion[];
    }
  });

  // Проверяем прогресс викторины на сегодня
  const { data: todayProgress } = useQuery({
    queryKey: ['quiz-progress', currentUser.id],
    queryFn: async () => {
      if (!isValidUUID(currentUser.id)) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_quiz_progress')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('date', today)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!currentUser.id && isValidUUID(currentUser.id)
  });

  // Мутация для сохранения прогресса
  const saveProgressMutation = useMutation({
    mutationFn: async ({ correct, completed }: { correct: boolean; completed: boolean }) => {
      if (!isValidUUID(currentUser.id)) {
        throw new Error('Ошибка пользователя');
      }

      const today = new Date().toISOString().split('T')[0];
      const newCorrectAnswers = correctAnswers + (correct ? 1 : 0);
      const newQuestionIndex = currentQuestionIndex + 1;

      // Обновляем или создаем прогресс
      const { data: existingProgress } = await supabase
        .from('user_quiz_progress')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('date', today)
        .single();

      if (existingProgress) {
        const { error } = await supabase
          .from('user_quiz_progress')
          .update({
            questions_answered: newQuestionIndex,
            correct_answers: newCorrectAnswers,
            completed
          })
          .eq('id', existingProgress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_quiz_progress')
          .insert({
            id: generateUUID(),
            user_id: currentUser.id,
            questions_answered: newQuestionIndex,
            correct_answers: newCorrectAnswers,
            date: today,
            completed
          });
        if (error) throw error;
      }

      // Обновляем жизни пользователя
      let newLives = currentUser.quiz_lives;
      let newStreak = currentUser.quiz_streak;
      let coinsReward = 0;

      if (!correct) {
        newLives = Math.max(0, currentUser.quiz_lives - 1);
      }

      if (completed) {
        // Рассчитываем награду
        const percentage = (newCorrectAnswers / (questions?.length || 1)) * 100;
        if (percentage >= 80) {
          coinsReward = 100;
          newStreak = currentUser.quiz_streak + 1;
        } else if (percentage >= 60) {
          coinsReward = 50;
          newStreak = currentUser.quiz_streak + 1;
        } else {
          newStreak = 0;
        }

        // Бонус за серию
        if (newStreak >= 3) {
          coinsReward += newStreak * 10;
        }
      }

      // Обновляем пользователя
      const { error: userError } = await supabase
        .from('users')
        .update({
          quiz_lives: newLives,
          quiz_streak: newStreak,
          coins: currentUser.coins + coinsReward,
          last_quiz_date: today
        })
        .eq('id', currentUser.id);

      if (userError) throw error;

      return { newLives, newStreak, coinsReward, newCorrectAnswers };
    },
    onSuccess: (data) => {
      onLivesUpdate(data.newLives);
      onStreakUpdate(data.newStreak);
      if (data.coinsReward > 0) {
        onCoinsUpdate(currentUser.coins + data.coinsReward);
        toast({
          title: "Награда получена!",
          description: `Вы получили ${data.coinsReward} монет`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['quiz-progress', currentUser.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить прогресс",
        variant: "destructive",
      });
    }
  });

  // Таймер
  useEffect(() => {
    if (isTimerActive && timeLeft > 0 && !showResult && !gameOver) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleAnswer("");
    }
  }, [timeLeft, isTimerActive, showResult, gameOver]);

  const currentQuestion = questions?.[currentQuestionIndex];

  const handleAnswer = (answer: string) => {
    if (showResult || gameOver) return;

    setSelectedAnswer(answer);
    setIsTimerActive(false);
    
    const correct = answer === currentQuestion?.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setCorrectAnswers(prev => prev + 1);
    }

    // Проверяем, закончилась ли игра
    const isLastQuestion = currentQuestionIndex === (questions?.length || 0) - 1;
    const livesLeft = correct ? currentUser.quiz_lives : Math.max(0, currentUser.quiz_lives - 1);
    
    if (!correct && livesLeft === 0) {
      setGameOver(true);
      saveProgressMutation.mutate({ correct, completed: true });
    } else if (isLastQuestion) {
      setGameOver(true);
      saveProgressMutation.mutate({ correct, completed: true });
    } else {
      saveProgressMutation.mutate({ correct, completed: false });
    }
  };

  const nextQuestion = () => {
    if (gameOver) return;
    
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer("");
    setShowResult(false);
    setTimeLeft(30);
    setIsTimerActive(true);
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setGameOver(false);
    setCorrectAnswers(0);
    setTimeLeft(30);
    setIsTimerActive(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Загрузка вопросов...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Вопросы не найдены</h2>
          <p className="text-slate-400 mb-6">В данный момент нет доступных вопросов</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  if (todayProgress?.completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Викторина завершена!</h2>
          <p className="text-slate-400 mb-2">
            Сегодня вы уже прошли викторину
          </p>
          <p className="text-lg text-white mb-6">
            Правильных ответов: {todayProgress.correct_answers} из {todayProgress.questions_answered}
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  if (currentUser.quiz_lives <= 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Жизни закончились</h2>
          <p className="text-slate-400 mb-6">Жизни восстанавливаются каждый день</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </button>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-white font-bold">{currentUser.quiz_lives}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-white font-bold">{currentUser.quiz_streak}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className={`font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">
              Вопрос {currentQuestionIndex + 1} из {questions.length}
            </span>
            <span className="text-white font-bold">
              Правильных: {correctAnswers}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Game Over Screen */}
        {gameOver && (
          <div className="text-center mb-6">
            <div className="bg-slate-800/50 rounded-lg p-8">
              {currentUser.quiz_lives > 0 ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              
              <h2 className="text-2xl font-bold text-white mb-4">
                {currentUser.quiz_lives > 0 ? 'Викторина завершена!' : 'Игра окончена'}
              </h2>
              
              <p className="text-slate-400 mb-4">
                Правильных ответов: {correctAnswers} из {currentQuestionIndex + 1}
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={onBack} variant="outline">
                  Выйти
                </Button>
                {currentUser.quiz_lives > 0 && (
                  <Button onClick={restartQuiz} className="bg-orange-500 hover:bg-orange-600">
                    Играть снова
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Question */}
        {!gameOver && currentQuestion && (
          <div className="bg-slate-800/50 rounded-lg p-6">
            {/* Question Image */}
            {currentQuestion.image_url && (
              <div className="mb-6 flex justify-center">
                <img
                  src={currentQuestion.image_url}
                  alt="Вопрос"
                  className="max-w-md max-h-64 object-contain rounded-lg"
                />
              </div>
            )}

            {/* Question Text */}
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              {currentQuestion.question}
            </h2>

            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { key: 'A', text: currentQuestion.option_a },
                { key: 'B', text: currentQuestion.option_b },
                { key: 'C', text: currentQuestion.option_c },
                { key: 'D', text: currentQuestion.option_d }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleAnswer(option.key)}
                  disabled={showResult}
                  className={`p-4 rounded-lg border transition-all ${
                    showResult
                      ? option.key === currentQuestion.correct_answer
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : option.key === selectedAnswer
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400'
                      : 'bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50 hover:border-orange-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      showResult
                        ? option.key === currentQuestion.correct_answer
                          ? 'bg-green-500 text-white'
                          : option.key === selectedAnswer
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-600 text-slate-400'
                        : 'bg-orange-500 text-white'
                    }`}>
                      {option.key}
                    </div>
                    <span>{option.text}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Result */}
            {showResult && !gameOver && (
              <div className="text-center">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
                  isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span className="font-bold">
                    {isCorrect ? 'Правильно!' : 'Неправильно!'}
                  </span>
                </div>

                <Button
                  onClick={nextQuestion}
                  className="mt-4 bg-orange-500 hover:bg-orange-600"
                >
                  Следующий вопрос
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
