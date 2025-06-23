
import { supabase } from "@/integrations/supabase/client";

// Улучшенный rate limiter с защитой от абуза
export class SecurityRateLimiter {
  private static attempts: Map<string, { count: number; lastAttempt: number; blocked: boolean }> = new Map();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly BLOCK_DURATION = 5 * 60 * 1000; // 5 минут
  private static readonly RESET_INTERVAL = 60 * 1000; // 1 минута

  static canPerformAction(userId: string, action: string): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, lastAttempt: now, blocked: false });
      return true;
    }

    // Проверяем, прошло ли время блокировки
    if (record.blocked && now - record.lastAttempt > this.BLOCK_DURATION) {
      record.blocked = false;
      record.count = 1;
      record.lastAttempt = now;
      return true;
    }

    // Если заблокирован
    if (record.blocked) {
      return false;
    }

    // Сброс счетчика после интервала
    if (now - record.lastAttempt > this.RESET_INTERVAL) {
      record.count = 1;
      record.lastAttempt = now;
      return true;
    }

    // Увеличиваем счетчик
    record.count++;
    record.lastAttempt = now;

    // Блокируем при превышении лимита
    if (record.count > this.MAX_ATTEMPTS) {
      record.blocked = true;
      console.warn(`Rate limit exceeded for user ${userId} action ${action}`);
      return false;
    }

    return true;
  }

  static getRemainingTime(userId: string, action: string): number {
    const key = `${userId}:${action}`;
    const record = this.attempts.get(key);
    
    if (!record || !record.blocked) return 0;
    
    const remaining = this.BLOCK_DURATION - (Date.now() - record.lastAttempt);
    return Math.max(0, remaining);
  }
}

// Валидация данных
export const validateInput = {
  username: (username: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  },
  
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  coins: (coins: number): boolean => {
    return Number.isInteger(coins) && coins >= 0 && coins <= 1000000;
  },
  
  skinPrice: (price: number): boolean => {
    return Number.isInteger(price) && price >= 0 && price <= 100000;
  }
};

// Защита от XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return char;
      }
    });
};

// Аудит логирование
export const auditLog = async (
  userId: string,
  action: string,
  details: Record<string, any>,
  success: boolean = true
) => {
  try {
    console.log(`AUDIT: User ${userId} performed ${action}`, {
      timestamp: new Date().toISOString(),
      userId,
      action,
      details,
      success,
      userAgent: navigator.userAgent,
      ip: 'client-side' // В реальном проекте IP получается на сервере
    });
    
    // В реальном проекте здесь была бы отправка на сервер аудита
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};
