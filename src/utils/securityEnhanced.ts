
import { supabase } from "@/integrations/supabase/client";

// Улучшенный валидатор с дополнительными проверками безопасности
export const enhancedValidation = {
  uuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  
  coins: (amount: number): boolean => {
    return Number.isInteger(amount) && amount >= 0 && amount <= 10000000 && !Number.isNaN(amount);
  },
  
  taskReward: (reward: number): boolean => {
    return Number.isInteger(reward) && reward >= 1 && reward <= 100000;
  },
  
  skinPrice: (price: number): boolean => {
    return Number.isInteger(price) && price >= 0 && price <= 1000000;
  },
  
  sanitizeString: (input: string): string => {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>'"&]/g, (char) => {
        const htmlEntities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return htmlEntities[char] || char;
      })
      .trim()
      .slice(0, 1000); // Ограничение длины для предотвращения DoS
  },
  
  // Проверка на SQL инъекции
  checkSqlInjection: (input: string): boolean => {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
      /(\bOR\b|\bAND\b).*[=<>]/i,
      /[';]--/,
      /\/\*.*\*\//,
      /\bEXEC\b|\bEXECUTE\b/i
    ];
    
    return !sqlPatterns.some(pattern => pattern.test(input));
  }
};

// Система мониторинга безопасности с улучшенными проверками
export class SecurityMonitor {
  private static suspiciousActivities: Map<string, { count: number; lastActivity: number }> = new Map();
  private static rateLimitCache: Map<string, { attempts: number; resetTime: number }> = new Map();
  private static adminCache: Map<string, { isAdmin: boolean; lastCheck: number }> = new Map();
  
  // ДОБАВЛЕНО: Проверка статуса администратора с кэшированием
  static async isAdmin(userId: string): Promise<boolean> {
    const cached = this.adminCache.get(userId);
    const now = Date.now();
    
    // Кэшируем результат на 5 минут
    if (cached && (now - cached.lastCheck) < 5 * 60 * 1000) {
      return cached.isAdmin;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle();
      
      if (error || !data) {
        console.error('🚨 [SECURITY] Failed to check admin status:', error);
        return false;
      }
      
      const isAdminUser = data.is_admin || false;
      this.adminCache.set(userId, { isAdmin: isAdminUser, lastCheck: now });
      
      return isAdminUser;
    } catch (error) {
      console.error('🚨 [SECURITY] Admin check error:', error);
      return false;
    }
  }
  
  // Серверная проверка rate limiting через существующую RPC функцию
  static async checkServerRateLimit(
    userId: string, 
    action: string, 
    maxAttempts: number = 10,
    windowMinutes: number = 60
  ): Promise<boolean> {
    try {
      // ИСПРАВЛЕНО: Администраторы пропускают rate limiting
      if (await this.isAdmin(userId)) {
        console.log(`👑 [SECURITY] Admin bypassing rate limit: ${action}`);
        return true;
      }

      if (!enhancedValidation.uuid(userId)) {
        console.error('🚨 [SECURITY] Invalid user ID format:', userId);
        return false;
      }

      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: userId,
        p_action: action,
        p_max_attempts: maxAttempts,
        p_window_minutes: windowMinutes
      });

      if (error) {
        console.error('🚨 [SECURITY] Rate limit check error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('🚨 [SECURITY] Rate limit check failed:', error);
      return false;
    }
  }
  
  // ИСПРАВЛЕНО: Добавляем алиас для совместимости
  static async checkRateLimit(userId: string, action: string): Promise<boolean> {
    return this.checkServerRateLimit(userId, action, 5, 10);
  }
  
  // Клиентская проверка как дополнительная защита
  static async checkClientRateLimit(userId: string, action: string, maxAttempts: number = 5): Promise<boolean> {
    // ИСПРАВЛЕНО: Администраторы пропускают клиентские проверки
    if (await this.isAdmin(userId)) {
      console.log(`👑 [SECURITY] Admin bypassing client rate limit: ${action}`);
      return true;
    }

    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 минута
    
    const current = this.rateLimitCache.get(key);
    
    if (!current || now > current.resetTime) {
      this.rateLimitCache.set(key, { attempts: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (current.attempts >= maxAttempts) {
      console.warn(`🚨 [SECURITY] Client rate limit exceeded: ${action} for user ${userId}`);
      return false;
    }
    
    current.attempts++;
    return true;
  }
  
  static async logSuspiciousActivity(
    userId: string, 
    activity: string, 
    details: Record<string, any>,
    riskLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    try {
      // ИСПРАВЛЕНО: Не логируем активность администраторов
      if (await this.isAdmin(userId)) {
        console.log(`👑 [SECURITY] Admin activity ignored: ${activity}`, details);
        return;
      }

      if (!enhancedValidation.uuid(userId)) {
        console.error('🚨 [SECURITY] Invalid user ID for suspicious activity log:', userId);
        return;
      }

      const key = `${userId}:${activity}`;
      const current = this.suspiciousActivities.get(key) || { count: 0, lastActivity: 0 };
      const now = Date.now();
      
      // Сброс счетчика каждые 24 часа
      if (now - current.lastActivity > 24 * 60 * 60 * 1000) {
        current.count = 0;
      }
      
      current.count++;
      current.lastActivity = now;
      this.suspiciousActivities.set(key, current);
      
      console.warn(`🔒 [SECURITY] Suspicious activity (${riskLevel}): ${activity}`, {
        userId,
        count: current.count,
        details: this.sanitizeLogDetails(details)
      });
      
      // Если слишком много подозрительной активности
      if (current.count >= 10) {
        console.error(`🚫 [SECURITY] High suspicious activity detected for user ${userId}`);
        console.warn('[SECURITY] High risk activity logged for investigation');
      }
    } catch (error) {
      console.error('💥 [SECURITY] Failed to log suspicious activity:', error);
    }
  }
  
  private static sanitizeLogDetails(details: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(details)) {
      if (typeof value === 'string') {
        sanitized[key] = enhancedValidation.sanitizeString(value);
      } else if (typeof value === 'number' && !Number.isNaN(value)) {
        sanitized[key] = Math.min(Math.max(value, -1000000), 1000000); // Ограничение числовых значений
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[FILTERED]';
      }
    }
    
    return sanitized;
  }
  
  // Проверка на аномальные паттерны
  static async detectAnomalousActivity(userId: string, action: string, value?: number): Promise<boolean> {
    // ИСПРАВЛЕНО: Администраторы не проверяются на аномальную активность
    if (await this.isAdmin(userId)) {
      console.log(`👑 [SECURITY] Admin bypassing anomaly detection: ${action}`);
      return false;
    }

    if (value && (action === 'purchase' || action === 'sell')) {
      // Подозрительно высокие суммы
      if (value > 100000) {
        this.logSuspiciousActivity(userId, `high_value_${action}`, { value }, 'high');
        return true;
      }
      
      // Подозрительно низкие цены продажи
      if (action === 'sell' && value < 1) {
        this.logSuspiciousActivity(userId, 'suspicious_low_sell_price', { value }, 'medium');
        return true;
      }
    }
    
    return false;
  }

  private static sanitizeLogDetails(details: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(details)) {
      if (typeof value === 'string') {
        sanitized[key] = enhancedValidation.sanitizeString(value);
      } else if (typeof value === 'number' && !Number.isNaN(value)) {
        sanitized[key] = Math.min(Math.max(value, -1000000), 1000000); // Ограничение числовых значений
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[FILTERED]';
      }
    }
    
    return sanitized;
  }
}

// Защита от XSS и injection атак
export const securityFilters = {
  sanitizeHtml: (html: string): string => {
    if (typeof html !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },
  
  validateJsonInput: (input: any): boolean => {
    try {
      if (typeof input === 'string') {
        const parsed = JSON.parse(input);
        // Проверяем на глубину вложенности
        return JSON.stringify(parsed).length < 10000;
      }
      return true;
    } catch {
      return false;
    }
  },
  
  // Улучшенная проверка на SQL инъекции
  checkForSqlInjection: (input: string): boolean => {
    return enhancedValidation.checkSqlInjection(input);
  },
  
  // Проверка на NoSQL инъекции
  checkForNoSqlInjection: (input: any): boolean => {
    if (typeof input === 'object' && input !== null) {
      const dangerous = ['$where', '$ne', '$gt', '$lt', '$regex', '$or', '$and'];
      const inputStr = JSON.stringify(input);
      return !dangerous.some(pattern => inputStr.includes(pattern));
    }
    return true;
  }
};

// Функция для безопасного выполнения операций с валидацией
export const secureOperation = async <T>(
  operation: () => Promise<T>,
  userId: string,
  action: string,
  params?: Record<string, any>
): Promise<T> => {
  try {
    // ИСПРАВЛЕНО: Администраторы пропускают проверки
    const isAdminUser = await SecurityMonitor.isAdmin(userId);
    
    if (!isAdminUser) {
      // Проверяем rate limiting на сервере только для не-админов
      const canProceed = await SecurityMonitor.checkServerRateLimit(userId, action);
      if (!canProceed) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      // Проверяем на аномальную активность
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (typeof value === 'number' && await SecurityMonitor.detectAnomalousActivity(userId, action, value)) {
            throw new Error('Suspicious activity detected.');
          }
          
          if (typeof value === 'string' && !enhancedValidation.checkSqlInjection(value)) {
            await SecurityMonitor.logSuspiciousActivity(userId, 'sql_injection_attempt', { key, value }, 'high');
            throw new Error('Invalid input detected.');
          }
        }
      }
    } else {
      console.log(`👑 [SECURITY] Admin user ${userId} bypassing all security checks for ${action}`);
    }
    
    // Выполняем операцию
    const result = await operation();
    
    // Логируем успешную операцию
    console.log(`✅ [SECURITY] Operation ${action} completed successfully for user ${userId}${isAdminUser ? ' (admin)' : ''}`);
    
    return result;
  } catch (error) {
    // Логируем неудачную операцию только для не-админов
    if (!(await SecurityMonitor.isAdmin(userId))) {
      await SecurityMonitor.logSuspiciousActivity(
        userId, 
        `failed_${action}`, 
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'medium'
      );
    }
    throw error;
  }
};
