
// Простая и чистая система валидации
export const validation = {
  uuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  
  coins: (amount: number): boolean => {
    return Number.isInteger(amount) && amount >= 0 && amount <= 1000000;
  },
  
  price: (price: number): boolean => {
    return Number.isInteger(price) && price >= 0 && price <= 100000;
  },
  
  sanitizeString: (input: string): string => {
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
  }
};

// Простой rate limiter
export class RateLimiter {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly RESET_INTERVAL = 60 * 1000; // 1 минута

  static canPerformAction(userId: string, action: string): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
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

    return record.count <= this.MAX_ATTEMPTS;
  }
}
