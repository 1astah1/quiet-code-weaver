
import { supabase } from "@/integrations/supabase/client";

// Улучшенный валидатор с дополнительными проверками
export const enhancedValidation = {
  uuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  
  coins: (amount: number): boolean => {
    return Number.isInteger(amount) && amount >= 0 && amount <= 1000000;
  },
  
  taskReward: (reward: number): boolean => {
    return Number.isInteger(reward) && reward >= 1 && reward <= 10000;
  },
  
  sanitizeString: (input: string): string => {
    return input.replace(/[<>'"&]/g, (char) => {
      const htmlEntities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return htmlEntities[char] || char;
    });
  }
};

// Система мониторинга безопасности
export class SecurityMonitor {
  private static suspiciousActivities: Map<string, number> = new Map();
  
  static async logSuspiciousActivity(
    userId: string, 
    activity: string, 
    details: Record<string, any>
  ): Promise<void> {
    try {
      const currentCount = this.suspiciousActivities.get(`${userId}:${activity}`) || 0;
      this.suspiciousActivities.set(`${userId}:${activity}`, currentCount + 1);
      
      // Логируем в базу данных
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: userId,
          action: `suspicious_${activity}`,
          details: details,
          success: false,
          ip_address: 'client-side',
          user_agent: navigator.userAgent
        });
      
      console.warn(`🔒 Suspicious activity detected for user ${userId}: ${activity}`, details);
      
      // Если слишком много подозрительной активности - блокируем
      if (currentCount >= 5) {
        this.blockUser(userId, activity);
      }
    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  }
  
  private static blockUser(userId: string, reason: string): void {
    console.error(`🚫 User ${userId} temporarily blocked due to: ${reason}`);
    // Здесь можно добавить логику блокировки пользователя
  }
  
  static async checkRateLimit(
    userId: string, 
    action: string, 
    maxAttempts: number = 5
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: userId,
        p_action_type: action,
        p_max_attempts: maxAttempts,
        p_time_window_minutes: 60
      });
      
      if (error) {
        console.error('Rate limit check failed:', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return false;
    }
  }
}

// Защита от XSS и injection атак
export const securityFilters = {
  sanitizeHtml: (html: string): string => {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },
  
  validateJsonInput: (input: any): boolean => {
    try {
      if (typeof input === 'string') {
        JSON.parse(input);
      }
      return true;
    } catch {
      return false;
    }
  },
  
  checkForSqlInjection: (input: string): boolean => {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
      /(\bOR\b|\bAND\b).*[=<>]/i,
      /[';]--/,
      /\/\*.*\*\//
    ];
    
    return !sqlPatterns.some(pattern => pattern.test(input));
  }
};
