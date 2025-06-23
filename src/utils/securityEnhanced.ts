
// Enhanced Security Validation and Monitoring
export const enhancedValidation = {
  uuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof value === 'string' && uuidRegex.test(value);
  },

  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof value === 'string' && emailRegex.test(value) && value.length <= 254;
  },

  username: (value: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return typeof value === 'string' && usernameRegex.test(value);
  },

  skinPrice: (value: number): boolean => {
    return typeof value === 'number' && 
           Number.isInteger(value) && 
           value >= 0 && 
           value <= 10000000;
  },

  quantity: (value: number): boolean => {
    return typeof value === 'number' && 
           Number.isInteger(value) && 
           value >= 1 && 
           value <= 1000;
  },

  sanitizeString: (value: string): string => {
    if (typeof value !== 'string') return '';
    return value
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
  },

  checkSqlInjection: (value: string): boolean => {
    if (typeof value !== 'string') return false;
    
    const sqlPatterns = [
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\bDROP\b.*\bTABLE\b)/i,
      /(\bINSERT\b.*\bINTO\b)/i,
      /(\bDELETE\b.*\bFROM\b)/i,
      /(\bUPDATE\b.*\bSET\b)/i,
      /(\bEXEC\b|\bEXECUTE\b)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\bOR\b.*=.*\bOR\b)/i,
      /(\bAND\b.*=.*\bAND\b)/i
    ];
    
    return !sqlPatterns.some(pattern => pattern.test(value));
  }
};

// Security Monitoring System
export class SecurityMonitor {
  private static rateLimitMap = new Map<string, { count: number; lastReset: number }>();
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute

  static checkClientRateLimit(userId: string, action: string, maxAttempts: number): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const current = this.rateLimitMap.get(key);
    
    if (!current || now - current.lastReset > this.RATE_LIMIT_WINDOW) {
      this.rateLimitMap.set(key, { count: 1, lastReset: now });
      return true;
    }
    
    if (current.count >= maxAttempts) {
      console.warn(`🚫 [SECURITY] Rate limit exceeded for ${userId}:${action}`);
      return false;
    }
    
    current.count++;
    return true;
  }

  static async logSuspiciousActivity(
    userId: string,
    activity: string,
    details: Record<string, any>,
    riskLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    try {
      console.warn(`🚨 [SECURITY] Suspicious activity: ${activity}`, {
        userId,
        details,
        riskLevel,
        timestamp: new Date().toISOString()
      });
      
      // В будущем здесь будет запись в базу данных
      // когда таблица suspicious_activities будет создана
      
    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  }
}
