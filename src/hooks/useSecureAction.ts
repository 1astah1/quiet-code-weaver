
import { useState, useCallback, useRef } from 'react';

interface UseSecureActionOptions {
  debounceMs?: number;
  cooldownMs?: number;
  maxAttempts?: number;
  windowMs?: number;
}

export const useSecureAction = (
  action: () => Promise<void> | void,
  options: UseSecureActionOptions = {}
) => {
  const {
    debounceMs = 300,
    cooldownMs = 1000,
    maxAttempts = 3,
    windowMs = 60000
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastActionRef = useRef<number>(0);
  const attemptsRef = useRef<number[]>([]);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    
    // Очищаем старые попытки
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );

    // Проверяем лимит
    if (attemptsRef.current.length >= maxAttempts) {
      return false;
    }

    // Проверяем cooldown
    if (now - lastActionRef.current < cooldownMs) {
      return false;
    }

    return true;
  }, [maxAttempts, windowMs, cooldownMs]);

  const executeAction = useCallback(async () => {
    if (isLoading || isBlocked) {
      console.log('🚫 Action blocked: loading or blocked state');
      return;
    }

    if (!checkRateLimit()) {
      console.log('🚫 Rate limit exceeded');
      setIsBlocked(true);
      setTimeout(() => setIsBlocked(false), cooldownMs);
      return;
    }

    // Очищаем предыдущий debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Устанавливаем debounce
    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const now = Date.now();
        
        attemptsRef.current.push(now);
        lastActionRef.current = now;

        await action();
      } catch (error) {
        console.error('🚨 Secure action error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [action, isLoading, isBlocked, checkRateLimit, debounceMs, cooldownMs]);

  // Очистка при размонтировании
  const cleanup = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  return {
    executeAction,
    isLoading,
    isBlocked,
    cleanup,
    canExecute: !isLoading && !isBlocked && checkRateLimit()
  };
};
