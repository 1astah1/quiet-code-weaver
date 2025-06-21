
import { useState, useEffect } from 'react';
import { SecurityValidator, secureAuditLog } from '@/utils/securityValidation';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  isBlocked: boolean;
  blockUntil: number;
}

// Серверо-клиентский rate limiter с дополнительной защитой
export const useSecureRateLimit = (
  userId: string, 
  action: string, 
  config: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 60000,
    blockDurationMs: 300000
  }
) => {
  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    lastAttempt: 0,
    isBlocked: false,
    blockUntil: 0
  });

  const checkRateLimit = async (): Promise<boolean> => {
    const now = Date.now();
    const key = `${userId}:${action}`;

    // Проверяем блокировку
    if (state.isBlocked && now < state.blockUntil) {
      await secureAuditLog(
        userId, 
        'rate_limit_blocked', 
        { action, remainingMs: state.blockUntil - now }, 
        false, 
        'medium'
      );
      return false;
    }

    // Сбрасываем блокировку если время истекло
    if (state.isBlocked && now >= state.blockUntil) {
      setState(prev => ({ ...prev, isBlocked: false, attempts: 0 }));
    }

    // Сбрасываем счетчик если прошло достаточно времени
    if (now - state.lastAttempt > config.windowMs) {
      setState(prev => ({ ...prev, attempts: 1, lastAttempt: now }));
      return true;
    }

    // Увеличиваем счетчик
    const newAttempts = state.attempts + 1;
    setState(prev => ({ ...prev, attempts: newAttempts, lastAttempt: now }));

    // Проверяем превышение лимита
    if (newAttempts > config.maxAttempts) {
      const blockUntil = now + config.blockDurationMs;
      setState(prev => ({ 
        ...prev, 
        isBlocked: true, 
        blockUntil 
      }));

      await secureAuditLog(
        userId, 
        'rate_limit_exceeded', 
        { action, attempts: newAttempts, blockDurationMs: config.blockDurationMs }, 
        false, 
        'high'
      );

      return false;
    }

    return true;
  };

  const getRemainingTime = (): number => {
    if (!state.isBlocked) return 0;
    return Math.max(0, state.blockUntil - Date.now());
  };

  return {
    checkRateLimit,
    getRemainingTime,
    isBlocked: state.isBlocked,
    attempts: state.attempts
  };
};
