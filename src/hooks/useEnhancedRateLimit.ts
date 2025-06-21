
import { useState, useEffect, useCallback } from 'react';

interface RateLimitRule {
  key: string;
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RateLimitState {
  attempts: number;
  firstAttempt: number;
  isBlocked: boolean;
  blockUntil: number;
  violations: number;
}

// Улучшенная система rate limiting с адаптивными лимитами
export const useEnhancedRateLimit = () => {
  const [limits, setLimits] = useState<Map<string, RateLimitState>>(new Map());

  const defaultRules: Record<string, RateLimitRule> = {
    case_opening: {
      key: 'case_opening',
      maxAttempts: 10,
      windowMs: 60000,
      blockDurationMs: 300000,
      severity: 'high'
    },
    skin_selling: {
      key: 'skin_selling',
      maxAttempts: 5,
      windowMs: 30000,
      blockDurationMs: 120000,
      severity: 'medium'
    },
    api_calls: {
      key: 'api_calls',
      maxAttempts: 30,
      windowMs: 60000,
      blockDurationMs: 60000,
      severity: 'low'
    },
    auth_attempts: {
      key: 'auth_attempts',
      maxAttempts: 3,
      windowMs: 300000,
      blockDurationMs: 900000,
      severity: 'critical'
    }
  };

  const checkRateLimit = useCallback((
    userId: string, 
    action: string, 
    customRule?: Partial<RateLimitRule>
  ): { allowed: boolean; remaining: number; resetTime: number; reason?: string } => {
    const rule = { ...defaultRules[action], ...customRule };
    if (!rule) {
      return { allowed: true, remaining: 999, resetTime: 0 };
    }

    const key = `${userId}:${action}`;
    const now = Date.now();
    const currentState = limits.get(key) || {
      attempts: 0,
      firstAttempt: now,
      isBlocked: false,
      blockUntil: 0,
      violations: 0
    };

    // Проверяем активную блокировку
    if (currentState.isBlocked && now < currentState.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: currentState.blockUntil,
        reason: 'Rate limit exceeded. Try again later.'
      };
    }

    // Сбрасываем блокировку если время истекло
    if (currentState.isBlocked && now >= currentState.blockUntil) {
      currentState.isBlocked = false;
      currentState.attempts = 0;
      currentState.firstAttempt = now;
    }

    // Сбрасываем окно если прошло достаточно времени
    if (now - currentState.firstAttempt > rule.windowMs) {
      currentState.attempts = 0;
      currentState.firstAttempt = now;
    }

    // Адаптивные лимиты на основе нарушений
    const adaptedMaxAttempts = Math.max(
      1, 
      rule.maxAttempts - Math.floor(currentState.violations / 2)
    );

    const remaining = Math.max(0, adaptedMaxAttempts - currentState.attempts);

    // Увеличиваем счетчик попыток
    currentState.attempts++;

    // Проверяем превышение лимита
    if (currentState.attempts > adaptedMaxAttempts) {
      currentState.isBlocked = true;
      currentState.blockUntil = now + rule.blockDurationMs * (1 + currentState.violations * 0.5);
      currentState.violations++;

      setLimits(prev => new Map(prev.set(key, currentState)));

      return {
        allowed: false,
        remaining: 0,
        resetTime: currentState.blockUntil,
        reason: `Too many ${action} attempts. Please wait.`
      };
    }

    setLimits(prev => new Map(prev.set(key, currentState)));

    return {
      allowed: true,
      remaining: remaining - 1,
      resetTime: currentState.firstAttempt + rule.windowMs
    };
  }, [limits]);

  const getRemainingTime = useCallback((userId: string, action: string): number => {
    const key = `${userId}:${action}`;
    const currentState = limits.get(key);
    
    if (!currentState?.isBlocked) return 0;
    return Math.max(0, currentState.blockUntil - Date.now());
  }, [limits]);

  const clearUserLimits = useCallback((userId: string) => {
    setLimits(prev => {
      const newLimits = new Map(prev);
      for (const [key] of newLimits) {
        if (key.startsWith(userId + ':')) {
          newLimits.delete(key);
        }
      }
      return newLimits;
    });
  }, []);

  return {
    checkRateLimit,
    getRemainingTime,
    clearUserLimits
  };
};
