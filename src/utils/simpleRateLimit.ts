
// Упрощенный клиентский rate limiter без конфликтов
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class SimpleClientRateLimit {
  private static instance: SimpleClientRateLimit;
  private limits = new Map<string, RateLimitEntry>();
  
  static getInstance(): SimpleClientRateLimit {
    if (!SimpleClientRateLimit.instance) {
      SimpleClientRateLimit.instance = new SimpleClientRateLimit();
    }
    return SimpleClientRateLimit.instance;
  }

  checkLimit(key: string, maxRequests: number = 15, windowMs: number = 60000): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    // Если нет записи или окно истекло - создаем новую
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    // Если превышен лимит
    if (entry.count >= maxRequests) {
      console.warn(`Rate limit exceeded for ${key}. Try again later.`);
      return false;
    }
    
    // Увеличиваем счетчик
    entry.count++;
    return true;
  }

  // Bypass для администраторов
  bypass(key: string): void {
    this.limits.delete(key);
  }

  // Очистка старых записей
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

export const clientRateLimit = SimpleClientRateLimit.getInstance();

// Автоматическая очистка каждые 5 минут
setInterval(() => {
  clientRateLimit.cleanup();
}, 5 * 60 * 1000);
