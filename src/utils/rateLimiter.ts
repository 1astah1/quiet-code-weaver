
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Удаляем старые запросы за пределами окна
    const validRequests = requests.filter(
      timestamp => now - timestamp < this.config.windowMs
    );

    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }

    // Добавляем текущий запрос
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(
      timestamp => now - timestamp < this.config.windowMs
    );
    
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  getResetTime(key: string): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    return requests[0] + this.config.windowMs;
  }

  clear(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

// Создаем экземпляры для разных операций
export const caseOpeningLimiter = new RateLimiter({
  maxRequests: 10, // 10 открытий кейсов
  windowMs: 60 * 1000 // за минуту
});

export const purchaseLimiter = new RateLimiter({
  maxRequests: 20, // 20 покупок
  windowMs: 60 * 1000 // за минуту
});

export const inventoryLimiter = new RateLimiter({
  maxRequests: 5, // 5 продаж
  windowMs: 30 * 1000 // за 30 секунд
});

export default RateLimiter;
