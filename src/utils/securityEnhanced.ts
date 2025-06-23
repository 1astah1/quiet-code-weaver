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

  coins: (value: number): boolean => {
    return typeof value === 'number' && 
           Number.isInteger(value) && 
           value >= 0 && 
           value <= 100000000;
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
  private static rateLimitMap = new Map<string, { count: number; lastReset: number; actions: Map<string, { count: number; lastReset: number }> }>();
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private static activityLog = new Map<string, Array<{ action: string; timestamp: number; data: any }>>();

  static checkClientRateLimit(userId: string, action: string, maxAttempts: number): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const current = this.rateLimitMap.get(key);
    
    if (!current || now - current.lastReset > this.RATE_LIMIT_WINDOW) {
      this.rateLimitMap.set(key, { count: 1, lastReset: now, actions: new Map() });
      return true;
    }
    
    if (current.count >= maxAttempts) {
      console.warn(`🚫 [SECURITY] Rate limit exceeded for ${userId}:${action}`);
      return false;
    }
    
    current.count++;
    return true;
  }

  static async checkRateLimit(userId: string, action: string, maxAttempts: number = 10): Promise<boolean> {
    return this.checkClientRateLimit(userId, action, maxAttempts);
  }

  static detectAnomalousActivity(userId: string, action: string, value?: number): boolean {
    const now = Date.now();
    const userActivity = this.activityLog.get(userId) || [];
    
    // Add current activity
    userActivity.push({ action, timestamp: now, data: { value } });
    
    // Keep only last 10 minutes of activity
    const recentActivity = userActivity.filter(activity => now - activity.timestamp < 10 * 60 * 1000);
    this.activityLog.set(userId, recentActivity);
    
    // Check for suspicious patterns
    const actionCount = recentActivity.filter(activity => activity.action === action).length;
    
    // Too many actions in short time
    if (actionCount > 20) {
      console.warn(`🚨 [SECURITY] Anomalous activity detected for ${userId}:${action} (${actionCount} times)`);
      return true;
    }
    
    // Suspicious high-value transactions
    if (value && value > 50000) {
      console.warn(`🚨 [SECURITY] High value transaction detected for ${userId}:${action} (${value})`);
      return true;
    }
    
    return false;
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

// Secure Operation Wrapper
export async function secureOperation<T>(
  operation: () => Promise<T>,
  userId: string,
  actionType: string,
  metadata?: Record<string, any>
): Promise<T> {
  try {
    console.log(`🔒 [SECURE_OP] Starting ${actionType} for user ${userId}`);
    
    // Log the operation attempt
    await SecurityMonitor.logSuspiciousActivity(
      userId,
      `${actionType}_attempt`,
      { metadata },
      'low'
    );
    
    const result = await operation();
    
    console.log(`✅ [SECURE_OP] ${actionType} completed successfully for user ${userId}`);
    return result;
    
  } catch (error) {
    console.error(`❌ [SECURE_OP] ${actionType} failed for user ${userId}:`, error);
    
    // Log the operation failure
    await SecurityMonitor.logSuspiciousActivity(
      userId,
      `${actionType}_failure`,
      { error: error instanceof Error ? error.message : 'Unknown error', metadata },
      'medium'
    );
    
    throw error;
  }
}
