
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Trophy, Clock, Zap } from "lucide-react";
import SecureButton from "@/components/ui/SecureButton";

interface ImprovedQuizScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    quiz_lives: number;
    quiz_streak: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  image_url?: string;
}

const ImprovedQuizScreen = ({ currentUser, onCoinsUpdate }: ImprovedQuizScreenProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [nextLifeRestore, setNextLifeRestore] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery({
    queryKey: ['quiz-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('is_active', true)
        .limit(10);
      
      if (error) throw error;
      return data as QuizQuestion[];
    }
  });

  // Проверяем восстановление жизней (8 часов)
  useEffect(() => {
    if (currentUser.quiz_lives < 3) {
      const lastLifeRestore = localStorage.getItem(`lastLifeRestore_${currentUser.id}`);
      if (lastLifeRestore) {
        const restoreTime = new Date(lastLifeRestore);
        const nextRestore = new Date(restoreTime.getTime() + 8 * 60 * 60 * 1000); // 8 часов
        
        if (new Date() >= nextRestore) {
          restoreLife.mutate();
        } else {
          setNextLifeRestore(nextRestore);
        }
      }
    }
  }, [currentUser.quiz_lives]);

  const restoreLife = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          quiz_lives: Math.min(currentUser.quiz_lives + 1, 3),
          last_life_restore: new Date().toISOString()
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      
      localStorage.setItem(`lastLifeRestore_${currentUser.id}`, new Date().toISOString());
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: "Жизнь восстановлена!",
        description: "Вы можете продолжить играть в викторину",
      });
    }
  });

  const submitQuiz = useMutation({
    mutationFn: async () => {
      const reward = score * 10; // 10 монет за правильный ответ
      
      const { error } = await supabase
        .from('users')
        .update({ 
          coins: currentUser.coins + reward,
          quiz_lives: currentUser.quiz_lives - 1,
          quiz_streak: score === questions?.length ? currentUser.quiz_streak + 1 : 0
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      return reward;
    },
    onSuccess: (reward) => {
      onCoinsUpdate(currentUser.coins + reward);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: "Викторина завершена!",
        description: `Вы заработали ${reward} монет! Правильных ответов: ${score}`,
      });
    }
  });

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmit = () => {
    if (!selectedAnswer || !questions) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setIsAnswered(true);
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer('');
        setIsAnswered(false);
      } else {
        setIsQuizComplete(true);
        submitQuiz.mutate();
      }
    }, 1500);
  };

  const startNewGame = () => {
    if (currentUser.quiz_lives <= 0) {
      toast({
        title: "Недостаточно жизней",
        description: "Дождитесь восстановления жизней",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setIsAnswered(false);
    setScore(0);
    setIsQuizComplete(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          <div className="h-40 bg-gray-700 rounded"></div>
          <div className="space-y-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <h2 className="text-xl text-white mb-2">Вопросы недоступны</h2>
          <p className="text-gray-400">Попробуйте позже</p>
        </div>
      </div>
    );
  }

  if (currentUser.quiz_lives <= 0 && !nextLifeRestore) {
    return (
      <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Heart className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl text-white mb-2">Жизни закончились</h2>
          <p className="text-gray-400 mb-4">Жизни восстанавливаются каждые 8 часов</p>
          {nextLifeRestore && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <Clock className="w-5 h-5 inline mr-2" />
              <span className="text-sm">
                Следующая жизнь через: {Math.ceil((nextLifeRestore.getTime() - Date.now()) / (1000 * 60))} мин
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isQuizComplete) {
    return (
      <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl text-white mb-2">Викторина завершена!</h2>
          <p className="text-gray-400 mb-4">Правильных ответов: {score}/{questions.length}</p>
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-4 rounded-lg mb-4">
            <p className="text-yellow-400">Заработано: {score * 10} монет</p>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-white">{currentUser.quiz_lives - 1}/3</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-white">Серия: {currentUser.quiz_streak}</span>
            </div>
          </div>
          {currentUser.quiz_lives > 1 && (
            <SecureButton 
              onClick={startNewGame}
              className="bg-green-600 hover:bg-green-700"
            >
              Играть еще раз
            </SecureButton>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const options = [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
    { key: 'D', text: currentQuestion.option_d }
  ];

  return (
    <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Викторина</h1>
          <p className="text-gray-400 text-sm">Вопрос {currentQuestionIndex + 1} из {questions.length}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-white text-sm">{currentUser.quiz_lives}/3</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-white text-sm">{score}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
        <div 
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        {currentQuestion.image_url && (
          <img 
            src={currentQuestion.image_url} 
            alt="Question" 
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
        <h2 className="text-lg font-semibold text-white mb-4">
          {currentQuestion.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map(option => (
          <button
            key={option.key}
            onClick={() => handleAnswerSelect(option.key)}
            disabled={isAnswered}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              selectedAnswer === option.key
                ? isAnswered
                  ? option.key === currentQuestion.correct_answer
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                  : 'bg-purple-600 text-white'
                : isAnswered && option.key === currentQuestion.correct_answer
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <span className="font-semibold mr-3">{option.key})</span>
            {option.text}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      {!isAnswered && (
        <SecureButton
          onClick={handleAnswerSubmit}
          disabled={!selectedAnswer}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Ответить
        </SecureButton>
      )}
    </div>
  );
};

export default ImprovedQuizScreen;
