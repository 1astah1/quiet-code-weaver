// Улучшенная система валидации и безопасности
export class SecurityValidator {
  // Строгая валидация UUID
  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Валидация монет с защитой от переполнения
  static validateCoins(amount: number): boolean {
    return Number.isInteger(amount) && 
           amount >= 0 && 
           amount <= 10000000 && // Максимальный лимит
           !Number.isNaN(amount);
  }

  // Валидация цены скина
  static validateSkinPrice(price: number): boolean {
    return Number.isInteger(price) && 
           price >= 0 && 
           price <= 1000000;
  }

  // Проверка на подозрительную активность
  static detectSuspiciousActivity(actionType: string, frequency: number): boolean {
    const limits: Record<string, number> = {
      'case_open': 20, // максимум 20 открытий в минуту
      'skin_sell': 10, // максимум 10 продаж в минуту
    };
    
    return frequency > (limits[actionType] || 5);
  }

  // Санитизация строк от XSS
  static sanitizeString(input: string): string {
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
      .slice(0, 1000); // Ограничение длины
  }

  // Проверка временных интервалов
  static validateTimeInterval(lastAction: Date, minIntervalMs: number): boolean {
    return Date.now() - lastAction.getTime() >= minIntervalMs;
  }
}

// Улучшенный аудит с детализацией
export const secureAuditLog = async (
  userId: string,
  action: string,
  details: Record<string, any>,
  success: boolean = true,
  riskLevel: 'low' | 'medium' | 'high' = 'low'
) => {
  try {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId: SecurityValidator.sanitizeString(userId),
      action: SecurityValidator.sanitizeString(action),
      details: details,
      success,
      riskLevel,
      userAgent: navigator.userAgent,
      sessionId: sessionStorage.getItem('session_id') || 'unknown',
      ip: 'client-side'
    };

    console.log(`🔒 SECURITY AUDIT [${riskLevel.toUpperCase()}]:`, auditEntry);

    // В продакшене здесь был бы отправлен на сервер аудита
    if (riskLevel === 'high') {
      console.warn('🚨 HIGH RISK ACTIVITY DETECTED:', auditEntry);
    }
  } catch (error) {
    console.error('Failed to log security audit:', error);
  }
};
