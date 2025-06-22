
import { useState, useEffect } from 'react';

export const useVibration = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Проверяем поддержку вибрации
    setIsSupported('vibrate' in navigator);
  }, []);

  const vibrate = (pattern: number | number[]) => {
    if (isSupported && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Предустановленные паттерны вибрации
  const patterns = {
    light: 50,
    medium: 100,
    heavy: 200,
    double: [100, 50, 100],
    triple: [100, 50, 100, 50, 100],
    success: [100, 50, 100, 50, 200],
    error: [200, 100, 200],
    caseOpening: [50, 30, 100, 30, 150, 30, 200], // Нарастающая вибрация
    rareItem: [200, 100, 200, 100, 300], // Сильная вибрация для редких предметов
  };

  return {
    isSupported,
    vibrate,
    patterns,
  };
};
