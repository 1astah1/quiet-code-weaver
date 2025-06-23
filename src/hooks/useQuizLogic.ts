import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSecureQuiz } from "@/hooks/useSecureQuiz";
import { Question } from "@/types/quiz";

interface UseQuizLogicProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    quiz_lives: number;
    quiz_streak: number;
  };
  questions: Question[];
  onCoinsUpdate: (newCoins: number) => void;
  onBack: () => void;
  onLivesUpdate: (newLives: number) => void;
  onStreakUpdate: (newStreak: number) => void;
}

export const useQuizLogic = ({
  currentUser,
  questions,
  onCoinsUpdate,
  onBack,
  onLivesUpdate,
  onStreakUpdate
}: UseQuizLogicProps) => {
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
  const [quizBlocked, setQuizBlocked] = useState(false);
  const [nextQuizTime, setNextQuizTime] = useState<Date | null>(null);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lifeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkQuizAvailability, updateQuizProgress } = useSecureQuiz();

  useEffect(() => {
    const checkQuizAccess = async () => {
      try {
        const result = await checkQuizAvailability(currentUser.id);
        
        if (!result.canTakeQuiz) {
          setQuizBlocked(true);
          if (result.nextAvailable) {
            setNextQuizTime(result.nextAvailable);
          }
          
          if (result.reason === '24h_cooldown') {
            toast({
              title: "Викторина недоступна",
              description: "Вы уже проходили викторину сегодня. Приходите завтра!",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error checking quiz access:', error);
      }
    };

    checkQuizAccess();
  }, [currentUser.id, checkQuizAvailability, toast]);

  useEffect(() => {
    const checkLifeRestoration = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('quiz_lives, last_life_restore, last_ad_life_restore')
          .eq('id', currentUser.id)
          .single();

        if (error || !data) return;

        const now = new Date();
        const lastRestore = data.last_life_restore ? new Date(data.last_life_restore) : null;
        const lastAdRestore = data.last_ad_life_restore ? new Date(data.last_ad_life_restore) : null;

        if (data.quiz_lives < 3 && lastRestore) {
          const eightHours = 8 * 60 * 60 * 1000;
          const timeSinceRestore = now.getTime() - lastRestore.getTime();
          const livesToRestore = Math.floor(timeSinceRestore / eightHours);

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
            const nextRestore = new Date(lastRestore.getTime() + eightHours);
            setNextLifeTime(nextRestore);
          }
        }

        if (lastAdRestore) {
          const eightHours = 8 * 60 * 60 * 1000;
          const timeSinceAdRestore = now.getTime() - lastAdRestore.getTime();
          setCanRestoreLife(timeSinceAdRestore >= eightHours && data.quiz_lives < 3);
        } else {
          setCanRestoreLife(data.quiz_lives < 3);
        }

        setLivesLeft(data.quiz_lives);
      } catch (error) {
        console.error('Error checking life restoration:', error);
      }
    };

    checkLifeRestoration();
    lifeCheckIntervalRef.current = setInterval(checkLifeRestoration, 60000);

    return () => {
      if (lifeCheckIntervalRef.current) {
        clearInterval(lifeCheckIntervalRef.current);
      }
    };
  }, [currentUser.id, onLivesUpdate]);

  useEffect(() => {
    return () => {
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
      if (lifeCheckIntervalRef.current) {
        clearInterval(lifeCheckIntervalRef.current);
      }
    };
  }, []);

  const updateUserStatsMutation = useMutation({
    mutationFn: async ({ lives, streak, coins }: { lives: number; streak: number; coins: number }) => {
      const { error } = await supabase
        .from('users')
        .update({ 
          quiz_lives: lives, 
          quiz_streak: streak, 
          coins: coins
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

  const handleAnswerSelect = useCallback((answer: string) => {
    if (!isProcessingAnswer && !showResult) {
      setSelectedAnswer(answer);
    }
  }, [isProcessingAnswer, showResult]);

  const handleNextQuestion = useCallback(async () => {
    if (!selectedAnswer || !questions || isProcessingAnswer || showResult) {
      return;
    }

    setIsProcessingAnswer(true);

    try {
      const newAnswers = [...userAnswers, selectedAnswer];
      setUserAnswers(newAnswers);

      const currentQuestion = questions[currentQuestionIndex];
      const isCorrect = selectedAnswer === currentQuestion.correct_answer;
      
      setLastAnswerCorrect(isCorrect);
      setShowResult(true);

      if (isCorrect) {
        setCorrectAnswersCount(prev => prev + 1);
      } else {
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
            
            if (resultTimeoutRef.current) {
              clearTimeout(resultTimeoutRef.current);
            }
            
            resultTimeoutRef.current = setTimeout(() => {
              setIsProcessingAnswer(false);
              onBack();
            }, 2000);
            return;
          }
        } catch (error) {
          console.error('Error updating lives:', error);
        }
      }

      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }

      resultTimeoutRef.current = setTimeout(() => {
        setShowResult(false);
        setLastAnswerCorrect(null);
        setIsProcessingAnswer(false);
        
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer('');
        } else {
          const finalCorrectCount = isCorrect ? correctAnswersCount + 1 : correctAnswersCount;
          completeQuiz(finalCorrectCount, questions.length);
        }
      }, 2000);

    } catch (error) {
      console.error('Error processing answer:', error);
      setIsProcessingAnswer(false);
      setShowResult(false);
      setLastAnswerCorrect(null);
    }
  }, [selectedAnswer, questions, isProcessingAnswer, showResult, userAnswers, currentQuestionIndex, livesLeft, correctAnswersCount, onLivesUpdate, toast, onBack]);

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

    await updateQuizProgress(currentUser.id, correctCount, totalQuestions);

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
    restoreLifeWithAdMutation.mutate();
  };

  return {
    currentQuestionIndex,
    selectedAnswer,
    quizCompleted,
    correctAnswersCount,
    showResult,
    lastAnswerCorrect,
    livesLeft,
    canRestoreLife,
    nextLifeTime,
    quizBlocked,
    nextQuizTime,
    isProcessingAnswer,
    handleAnswerSelect,
    handleNextQuestion,
    handleRestoreLife,
    restoreLifeWithAdMutation
  };
};
