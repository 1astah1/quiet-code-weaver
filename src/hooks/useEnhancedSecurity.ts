
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityMetrics {
  rateLimitViolations: number;
  suspiciousActions: number;
  lastViolation: Date | null;
}

interface User {
  id: string;
  is_admin?: boolean;
}

// Клиентский rate limiter с localStorage
class ClientRateLimiter {
  private static getStorageKey(userId: string, action: string): string {
    return `rateLimit_${userId}_${action}`;
  }

  static canPerformAction(
    userId: string, 
    action: string, 
    maxAttempts: number = 5, 
    windowMs: number = 10 * 60 * 1000, // 10 минут
    isAdmin: boolean = false
  ): boolean {
    // Администраторы всегда могут выполнять действия
    if (isAdmin) {
      console.log(`👑 [CLIENT_RATE_LIMIT] Admin user bypassing rate limit for ${action}`);
      return true;
    }

    const key = this.getStorageKey(userId, action);
    const now = Date.now();
    
    try {
      const stored = localStorage.getItem(key);
      const attempts: number[] = stored ? JSON.parse(stored) : [];
      
      // Фильтруем старые попытки
      const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
      
      if (recentAttempts.length >= maxAttempts) {
        console.warn(`🚫 [CLIENT_RATE_LIMIT] Rate limit exceeded for ${userId}:${action} (${recentAttempts.length}/${maxAttempts})`);
        return false;
      }
      
      // Добавляем текущую попытку
      recentAttempts.push(now);
      localStorage.setItem(key, JSON.stringify(recentAttempts));
      
      return true;
    } catch (error) {
      console.error('Rate limiter storage error:', error);
      return true; // Если ошибка в localStorage, разрешаем действие
    }
  }

  static getRemainingAttempts(userId: string, action: string, maxAttempts: number = 5, windowMs: number = 10 * 60 * 1000): number {
    const key = this.getStorageKey(userId, action);
    const now = Date.now();
    
    try {
      const stored = localStorage.getItem(key);
      const attempts: number[] = stored ? JSON.parse(stored) : [];
      const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
      
      return Math.max(0, maxAttempts - recentAttempts.length);
    } catch {
      return maxAttempts;
    }
  }

  static getNextResetTime(userId: string, action: string, windowMs: number = 10 * 60 * 1000): number {
    const key = this.getStorageKey(userId, action);
    
    try {
      const stored = localStorage.getItem(key);
      const attempts: number[] = stored ? JSON.parse(stored) : [];
      
      if (attempts.length === 0) return 0;
      
      const oldestAttempt = Math.min(...attempts);
      return oldestAttempt + windowMs;
    } catch {
      return 0;
    }
  }
}

export const useEnhancedSecurity = (user: User) => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    rateLimitViolations: 0,
    suspiciousActions: 0,
    lastViolation: null
  });
  const [isBlocked, setIsBlocked] = useState(false);

  // Проверяем статус администратора
  const isAdmin = user.is_admin || false;

  // Улучшенная проверка rate limit
  const checkRateLimit = useCallback(async (
    action: string, 
    maxAttempts: number = 5, 
    windowMinutes: number = 10
  ): Promise<boolean> => {
    try {
      // Администраторы всегда проходят проверку
      if (isAdmin) {
        console.log(`👑 [SECURITY] Admin user bypassing rate limit for action: ${action}`);
        return true;
      }

      const windowMs = windowMinutes * 60 * 1000;
      
      // Сначала проверяем клиентский лимит
      if (!ClientRateLimiter.canPerformAction(user.id, action, maxAttempts, windowMs, isAdmin)) {
        const remaining = ClientRateLimiter.getRemainingAttempts(user.id, action, maxAttempts, windowMs);
        const resetTime = ClientRateLimiter.getNextResetTime(user.id, action, windowMs);
        
        console.warn(`🚫 Client rate limit exceeded for ${action}. Remaining: ${remaining}, Reset: ${new Date(resetTime).toLocaleString()}`);
        
        setMetrics(prev => ({
          ...prev,
          rateLimitViolations: prev.rateLimitViolations + 1,
          lastViolation: new Date()
        }));
        
        // Временная блокировка на 3 секунды вместо 5 минут
        setIsBlocked(true);
        setTimeout(() => {
          setIsBlocked(false);
        }, 3000);
        
        return false;
      }

      // Проверяем серверный rate limit (только для критических действий)
      if (['purchase_skin', 'open_case', 'sell_skin'].includes(action)) {
        console.log(`🔒 Checking server rate limit for action: ${action}`);
        
        const { data, error } = await supabase.rpc('check_rate_limit', {
          p_user_id: user.id,
          p_action: action,
          p_max_attempts: maxAttempts * 2, // Более мягкий серверный лимит
          p_window_minutes: windowMinutes
        });

        if (error) {
          console.error('❌ Server rate limit check error:', error);
          return true; // При ошибке разрешаем действие
        }

        return data as boolean;
      }

      return true;
    } catch (error) {
      console.error('💥 Security check failed:', error);
      return isAdmin; // Администраторы проходят даже при ошибках
    }
  }, [user.id, isAdmin]);

  // Валидация входных данных
  const validateInput = useCallback((input: any, type: 'uuid' | 'coins' | 'string'): boolean => {
    switch (type) {
      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(input);
      
      case 'coins':
        return Number.isInteger(input) && input >= 0 && input <= 10000000;
      
      case 'string':
        return typeof input === 'string' && input.length <= 1000;
      
      default:
        return false;
    }
  }, []);

  // Санитизация строк
  const sanitizeString = useCallback((input: string): string => {
    return input
      .replace(/[<>'"&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      })
      .trim()
      .slice(0, 1000);
  }, []);

  // Логирование подозрительной активности (только для не-админов)
  const logSuspiciousActivity = useCallback(async (
    activity: string,
    details: Record<string, any>
  ): Promise<void> => {
    try {
      // Не логируем активность администраторов как подозрительную
      if (isAdmin) {
        console.log(`👑 [SECURITY] Admin activity ignored: ${activity}`, details);
        return;
      }

      console.warn(`🚨 Suspicious activity detected: ${activity}`, details);
      
      setMetrics(prev => ({
        ...prev,
        suspiciousActions: prev.suspiciousActions + 1,
        lastViolation: new Date()
      }));

      // В реальном приложении здесь был бы вызов к серверу для логирования
      
    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  }, [isAdmin]);

  // Получение информации о rate limit
  const getRateLimitInfo = useCallback((action: string) => {
    if (isAdmin) {
      return {
        remaining: Infinity,
        resetTime: 0,
        canPerform: true
      };
    }

    const remaining = ClientRateLimiter.getRemainingAttempts(user.id, action);
    const resetTime = ClientRateLimiter.getNextResetTime(user.id, action);
    
    return {
      remaining,
      resetTime: resetTime > 0 ? new Date(resetTime) : null,
      canPerform: remaining > 0
    };
  }, [user.id, isAdmin]);

  return {
    metrics,
    isBlocked: isBlocked && !isAdmin,
    checkRateLimit,
    validateInput,
    sanitizeString,
    logSuspiciousActivity,
    getRateLimitInfo,
    isAdmin
  };
};
