
import { QueryClient } from '@tanstack/react-query';
import { connectionOptimizer } from './connectionOptimizer';

// Создаем оптимизированный QueryClient с учетом качества соединения
export const createOptimizedQueryClient = () => {
  const optimizedConfig = connectionOptimizer.getOptimizedQueryConfig();
  
  return new QueryClient({
    defaultOptions: {
      queries: {
        ...optimizedConfig,
        // Предотвращаем дублирование запросов
        structuralSharing: true,
        // Используем более агрессивное кэширование для медленных соединений
        networkMode: 'offlineFirst',
      },
      mutations: {
        retry: 2,
        networkMode: 'offlineFirst',
      },
    },
  });
};

// Утилита для дебаунса запросов
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Батчинг запросов для оптимизации
class RequestBatcher {
  private batches: Map<string, Array<() => Promise<any>>> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  public addToBatch(batchKey: string, request: () => Promise<any>, delay = 50) {
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, []);
    }

    this.batches.get(batchKey)!.push(request);

    // Очищаем предыдущий таймер
    const existingTimer = this.timers.get(batchKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Устанавливаем новый таймер
    const timer = setTimeout(() => {
      this.executeBatch(batchKey);
    }, delay);

    this.timers.set(batchKey, timer);
  }

  private async executeBatch(batchKey: string) {
    const requests = this.batches.get(batchKey);
    if (!requests || requests.length === 0) {
      return;
    }

    // Выполняем все запросы в батче параллельно
    try {
      await Promise.allSettled(requests.map(request => request()));
    } catch (error) {
      console.error('Batch execution failed:', error);
    } finally {
      // Очищаем батч
      this.batches.delete(batchKey);
      this.timers.delete(batchKey);
    }
  }
}

export const requestBatcher = new RequestBatcher();
