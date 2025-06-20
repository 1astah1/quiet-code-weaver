
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Clock, Star, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
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
}

const QuizScreen = ({ currentUser, onCoinsUpdate }: QuizScreenProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { toast } = useToast();

  const { data: questions } = useQuery({
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

  const startGame = () => {
    setGameStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setLives(3);
    setGameEnded(false);
    setSelectedAnswer("");
    setShowResult(false);
    setIsCorrect(null);
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !questions) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correct_answer;
    
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(score + 1);
    } else {
      setLives(lives - 1);
    }

    setTimeout(() => {
      if (!correct && lives - 1 <= 0) {
        // Game over
        endGame();
      } else if (currentQuestionIndex + 1 >= questions.length) {
        // All questions answered
        endGame();
      } else {
        // Next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer("");
        setShowResult(false);
        setIsCorrect(null);
      }
    }, 2000);
  };

  const endGame = async () => {
    setGameEnded(true);
    
    // Calculate coins reward
    const coinsEarned = score * 10;
    if (coinsEarned > 0) {
      try {
        const newCoins = currentUser.coins + coinsEarned;
        const { error } = await supabase
          .from('users')
          .update({ coins: newCoins })
          .eq('id', currentUser.id);

        if (error) throw error;

        onCoinsUpdate(newCoins);
        
        toast({
          title: "Викторина завершена!",
          description: `Заработано ${coinsEarned} монет`,
        });
      } catch (error) {
        console.error('Coins update error:', error);
      }
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameEnded(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setLives(3);
    setSelectedAnswer("");
    setShowResult(false);
    setIsCorrect(null);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Brain className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">CS2 Викторина</h1>
            <p className="text-gray-400">Проверь свои знания о Counter-Strike 2</p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/30 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Правила игры:</h2>
            <ul className="space-y-2 text-gray-300">
              <li>• У вас есть 3 жизни</li>
              <li>• За каждый правильный ответ +10 монет</li>
              <li>• Неправильный ответ отнимает жизнь</li>
              <li>• Цель: ответить на максимум вопросов</li>
            </ul>
          </div>

          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
          >
            Начать викторину
          </button>
        </div>
      </div>
    );
  }

  if (gameEnded) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-gray-800/50 rounded-xl p-8 border border-orange-500/30">
            <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Игра окончена!</h1>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400">Правильных ответов</p>
                <p className="text-3xl font-bold text-white">{score}</p>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400">Заработано монет</p>
                <p className="text-3xl font-bold text-yellow-400">{score * 10}</p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold"
            >
              Играть снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-4 flex items-center justify-center">
        <p className="text-gray-400">Загрузка вопросов...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const options = [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
    { key: 'D', text: currentQuestion.option_d },
  ];

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      <div className="max-w-md mx-auto">
        {/* Game Stats */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <span className="text-white font-semibold">
              {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-white">Жизни:</span>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < lives ? 'bg-red-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-orange-500/30 mb-6">
          <h2 className="text-xl font-bold text-white mb-6">{currentQuestion.question}</h2>
          
          {/* Options */}
          <div className="space-y-3">
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => handleAnswerSelect(option.key)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedAnswer === option.key
                    ? showResult
                      ? isCorrect
                        ? 'bg-green-600/20 border-green-500 text-green-400'
                        : 'bg-red-600/20 border-red-500 text-red-400'
                      : 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : showResult && option.key === currentQuestion.correct_answer
                      ? 'bg-green-600/20 border-green-500 text-green-400'
                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                <span className="font-bold mr-3">{option.key}.</span>
                {option.text}
                {showResult && option.key === currentQuestion.correct_answer && (
                  <CheckCircle className="w-5 h-5 text-green-400 float-right mt-1" />
                )}
                {showResult && selectedAnswer === option.key && !isCorrect && (
                  <X className="w-5 h-5 text-red-400 float-right mt-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        {!showResult && (
          <button
            onClick={submitAnswer}
            disabled={!selectedAnswer}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              selectedAnswer
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:scale-105'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Ответить
          </button>
        )}

        {/* Result */}
        {showResult && (
          <div className={`text-center p-4 rounded-xl ${
            isCorrect ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
          }`}>
            <p className="text-lg font-bold">
              {isCorrect ? 'Правильно! +10 монет' : 'Неправильно! -1 жизнь'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
