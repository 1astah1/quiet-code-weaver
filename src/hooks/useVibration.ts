
import { useCallback } from 'react';

export const useVibration = () => {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration not supported or failed:', error);
      }
    }
  }, []);

  const vibrateLight = useCallback(() => {
    vibrate(50); // Короткая легкая вибрация
  }, [vibrate]);

  const vibrateSuccess = useCallback(() => {
    vibrate([100, 50, 100]); // Двойная вибрация для успеха
  }, [vibrate]);

  const vibrateError = useCallback(() => {
    vibrate([200, 100, 200, 100, 200]); // Длинная вибрация для ошибки
  }, [vibrate]);

  const vibrateRare = useCallback(() => {
    vibrate([150, 100, 150, 100, 150, 100, 300]); // Особая вибрация для редких предметов
  }, [vibrate]);

  return {
    vibrate,
    vibrateLight,
    vibrateSuccess,
    vibrateError,
    vibrateRare
  };
};
