import { useState, useEffect, useCallback, useRef } from 'react';

// Заглушки для API
const fetchQuizState = async () => {
  // Здесь должен быть запрос к серверу
  return {
    hearts: 5,
    lastRestore: Date.now(),
    adWatchedAt: null,
    currentQuestion: {
      text: 'Какой цвет у неба?',
      answers: ['Синий', 'Зелёный', 'Красный', 'Жёлтый'],
      correct: 'Синий',
    },
  };
};
const sendAnswer = async (answer: string) => {
  // Здесь должен быть запрос к серверу
  return { correct: answer === 'Синий' };
};
const restoreHeartByAd = async () => {
  // Здесь должен быть запрос к серверу
  return { success: true };
};

interface QuizQuestion {
  text: string;
  answers: string[];
  correct: string;
}

export function useQuiz() {
  const [hearts, setHearts] = useState(5);
  const [lastRestore, setLastRestore] = useState(Date.now());
  const [adWatchedAt, setAdWatchedAt] = useState<number|null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [canAnswer, setCanAnswer] = useState(true);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreTimeLeft, setRestoreTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  // Загрузка состояния викторины
  useEffect(() => {
    fetchQuizState().then(state => {
      setHearts(state.hearts);
      setLastRestore(state.lastRestore);
      setAdWatchedAt(state.adWatchedAt);
      setCurrentQuestion(state.currentQuestion as QuizQuestion);
      setCanAnswer(state.hearts > 0);
      setIsRestoreModalOpen(state.hearts === 0);
    });
  }, []);

  // Таймер восстановления сердец
  useEffect(() => {
    if (hearts > 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, 8 * 3600 - Math.floor((now - lastRestore) / 1000));
      setRestoreTimeLeft(diff);
      if (diff === 0) {
        setHearts(1);
        setCanAnswer(true);
        setIsRestoreModalOpen(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hearts, lastRestore]);

  // Ответ на вопрос
  const handleAnswer = useCallback(async (answer: string) => {
    setLoading(true);
    const res = await sendAnswer(answer);
    setLoading(false);
    if (res.correct) {
      // Следующий вопрос (заглушка)
      setCurrentQuestion({
        text: 'Столица Франции?',
        answers: ['Париж', 'Берлин', 'Лондон', 'Мадрид'],
        correct: 'Париж',
      });
    } else {
      setHearts(h => Math.max(0, h - 1));
      if (hearts - 1 <= 0) {
        setCanAnswer(false);
        setIsRestoreModalOpen(true);
        setLastRestore(Date.now());
      }
    }
  }, [hearts]);

  // Просмотр рекламы для восстановления сердца
  const handleWatchAd = useCallback(async () => {
    if (adWatchedAt && Date.now() - adWatchedAt < 24 * 3600 * 1000) return;
    const res = await restoreHeartByAd();
    if (res.success) {
      setHearts(h => Math.min(5, h + 1));
      setAdWatchedAt(Date.now());
      setCanAnswer(true);
      setIsRestoreModalOpen(false);
    }
  }, [adWatchedAt]);

  const closeRestoreModal = () => setIsRestoreModalOpen(false);

  return {
    hearts,
    isRestoreModalOpen,
    currentQuestion,
    canAnswer,
    handleAnswer,
    handleWatchAd,
    restoreTimeLeft,
    closeRestoreModal,
    loading,
  };
}

export function useSecureQuiz() {
  const quiz = useQuiz();
  const lastActionRef = useRef<number>(0);

  // Защита от спама и двойных кликов
  const safeHandleAnswer = async (answer: string) => {
    const now = Date.now();
    if (now - lastActionRef.current < 1000) return; // не чаще 1 раза в секунду
    lastActionRef.current = now;
    // Здесь можно добавить проверку токена пользователя и логирование
    await quiz.handleAnswer(answer);
  };

  const safeHandleWatchAd = async () => {
    const now = Date.now();
    if (now - lastActionRef.current < 1000) return;
    lastActionRef.current = now;
    // Здесь можно добавить проверку токена пользователя и логирование
    await quiz.handleWatchAd();
  };

  return {
    ...quiz,
    handleAnswer: safeHandleAnswer,
    handleWatchAd: safeHandleWatchAd,
  };
} 