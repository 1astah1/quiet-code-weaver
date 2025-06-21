
class ConnectionOptimizer {
  private static instance: ConnectionOptimizer;
  private connectionQuality: 'fast' | 'slow' | 'offline' = 'fast';
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  public static getInstance(): ConnectionOptimizer {
    if (!ConnectionOptimizer.instance) {
      ConnectionOptimizer.instance = new ConnectionOptimizer();
    }
    return ConnectionOptimizer.instance;
  }

  constructor() {
    this.detectConnectionQuality();
    this.setupConnectionMonitoring();
  }

  private detectConnectionQuality() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.connectionQuality = 'slow';
        } else {
          this.connectionQuality = 'fast';
        }
      }
    }

    this.testConnectionSpeed();
  }

  private async testConnectionSpeed() {
    const startTime = performance.now();
    try {
      await fetch('/favicon.ico?' + Math.random(), { 
        cache: 'no-cache',
        method: 'HEAD' 
      });
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      if (latency > 800) { // Уменьшаем порог для определения медленного соединения
        this.connectionQuality = 'slow';
      } else {
        this.connectionQuality = 'fast';
      }
    } catch {
      this.connectionQuality = 'offline';
    }
  }

  private setupConnectionMonitoring() {
    window.addEventListener('online', () => {
      this.connectionQuality = 'fast';
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.connectionQuality = 'offline';
    });
  }

  public getConnectionQuality() {
    return this.connectionQuality;
  }

  public async optimizedFetch<T>(fetchFn: () => Promise<T>): Promise<T> {
    if (this.connectionQuality === 'offline') {
      throw new Error('No internet connection');
    }

    // Упрощаем логику - убираем очередь для быстрой загрузки
    return fetchFn();
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
          if (this.connectionQuality === 'slow') {
            await new Promise(resolve => setTimeout(resolve, 50)); // Уменьшаем задержку
          }
        } catch (error) {
          console.error('Queue request failed:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  public getOptimizedQueryConfig() {
    const baseConfig = {
      staleTime: 3 * 60 * 1000, // Уменьшаем время кэша
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    };

    if (this.connectionQuality === 'slow') {
      return {
        ...baseConfig,
        staleTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 15000),
      };
    }

    return baseConfig;
  }
}

export const connectionOptimizer = ConnectionOptimizer.getInstance();
