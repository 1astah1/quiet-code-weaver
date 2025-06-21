
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import { connectionOptimizer } from '@/utils/connectionOptimizer';

interface OptimizedQueryConfig<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: (string | number)[];
  queryFn: () => Promise<T>;
  enableBatching?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

// Глобальный кэш для предотвращения дублирования запросов
const queryCache = new Map<string, Promise<any>>();
const batchTimeouts = new Map<string, NodeJS.Timeout>();

export const useOptimizedQuery = <T>({
  queryKey,
  queryFn,
  enableBatching = false,
  priority = 'medium',
  ...options
}: OptimizedQueryConfig<T>) => {
  const cacheKey = JSON.stringify(queryKey);
  const requestRef = useRef<Promise<T>>();

  const optimizedQueryFn = useCallback(async (): Promise<T> => {
    // Проверяем кэш для предотвращения дублирования
    if (queryCache.has(cacheKey)) {
      return queryCache.get(cacheKey);
    }

    // Создаем оптимизированный запрос
    const optimizedFn = () => connectionOptimizer.optimizedFetch(queryFn);
    
    if (enableBatching) {
      // Батчим запросы для снижения нагрузки
      return new Promise((resolve, reject) => {
        if (batchTimeouts.has(cacheKey)) {
          clearTimeout(batchTimeouts.get(cacheKey)!);
        }

        const timeout = setTimeout(async () => {
          try {
            const promise = optimizedFn();
            queryCache.set(cacheKey, promise);
            
            const result = await promise;
            resolve(result);
            
            // Очищаем кэш через некоторое время
            setTimeout(() => {
              queryCache.delete(cacheKey);
            }, 10000);
          } catch (error) {
            queryCache.delete(cacheKey);
            reject(error);
          } finally {
            batchTimeouts.delete(cacheKey);
          }
        }, priority === 'high' ? 0 : priority === 'medium' ? 50 : 100);

        batchTimeouts.set(cacheKey, timeout);
      });
    }

    const promise = optimizedFn();
    queryCache.set(cacheKey, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      // Очищаем кэш через некоторое время
      setTimeout(() => {
        queryCache.delete(cacheKey);
      }, 5000);
    }
  }, [cacheKey, queryFn, enableBatching, priority]);

  const connectionQuality = connectionOptimizer.getConnectionQuality();
  
  // Адаптивные настройки в зависимости от качества соединения
  const adaptiveOptions = {
    staleTime: connectionQuality === 'slow' ? 15 * 60 * 1000 : 5 * 60 * 1000,
    gcTime: connectionQuality === 'slow' ? 30 * 60 * 1000 : 10 * 60 * 1000,
    retry: connectionQuality === 'slow' ? 2 : 1,
    retryDelay: (attemptIndex: number) => 
      connectionQuality === 'slow' 
        ? Math.min(2000 * 2 ** attemptIndex, 30000)
        : Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    ...options
  };

  return useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    ...adaptiveOptions,
  });
};
