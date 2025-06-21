
import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification';

interface HapticFeedbackOptions {
  enabled?: boolean;
}

export const useHapticFeedback = (options: HapticFeedbackOptions = {}) => {
  const { enabled = true } = options;

  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (!enabled) return;

    // Проверяем доступность Haptic Engine (iOS)
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(40);
          break;
        case 'selection':
          navigator.vibrate(5);
          break;
        case 'impact':
          navigator.vibrate([10, 10, 10]);
          break;
        case 'notification':
          navigator.vibrate([100, 50, 100]);
          break;
      }
    }

    // Для Web Vibration API поддержка
    if ('serviceWorker' in navigator && 'Notification' in window) {
      // Дополнительная обработка для PWA
      console.log(`🔔 [HAPTIC] Triggered ${type} feedback`);
    }
  }, [enabled]);

  const tapFeedback = useCallback(() => triggerHaptic('selection'), [triggerHaptic]);
  const successFeedback = useCallback(() => triggerHaptic('notification'), [triggerHaptic]);
  const errorFeedback = useCallback(() => triggerHaptic('heavy'), [triggerHaptic]);
  const buttonFeedback = useCallback(() => triggerHaptic('light'), [triggerHaptic]);

  return {
    triggerHaptic,
    tapFeedback,
    successFeedback,
    errorFeedback,
    buttonFeedback
  };
};
