
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import { connectionOptimizer } from '@/utils/connectionOptimizer';

interface OptimizedQueryConfig<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: (string | number)[];
  queryFn: () => Promise<T>;
  enableBatching?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

// Упрощенный глобальный кэш для предотвращения дублирования запросов
const queryCache = new Map<string, Promise<any>>();

export const useOptimizedQuery = <T>({
  queryKey,
  queryFn,
  enableBatching = false,
  priority = 'medium',
  ...options
}: OptimizedQueryConfig<T>) => {
  const cacheKey = JSON.stringify(queryKey);

  const optimizedQueryFn = useCallback(async (): Promise<T> => {
    // Проверяем кэш для предотвращения дублирования
    if (queryCache.has(cacheKey)) {
      const cachedPromise = queryCache.get(cacheKey);
      // Проверяем, не истек ли кэш (5 секунд для предотвращения бесконечного кэширования)
      setTimeout(() => {
        queryCache.delete(cacheKey);
      }, 5000);
      return cachedPromise;
    }

    // Создаем оптимизированный запрос
    const promise = connectionOptimizer.optimizedFetch(queryFn);
    queryCache.set(cacheKey, promise);
    
    try {
      const result = await promise;
      return result;
    } catch (error) {
      // Удаляем из кэша при ошибке
      queryCache.delete(cacheKey);
      throw error;
    }
  }, [cacheKey, queryFn]);

  const connectionQuality = connectionOptimizer.getConnectionQuality();
  
  // Адаптивные настройки в зависимости от качества соединения
  const adaptiveOptions = {
    staleTime: connectionQuality === 'slow' ? 10 * 60 * 1000 : 3 * 60 * 1000, // Уменьшаем время кэша
    gcTime: connectionQuality === 'slow' ? 15 * 60 * 1000 : 5 * 60 * 1000,
    retry: connectionQuality === 'slow' ? 1 : 1, // Уменьшаем количество повторов
    retryDelay: (attemptIndex: number) => 
      connectionQuality === 'slow' 
        ? Math.min(1000 * 2 ** attemptIndex, 10000)
        : Math.min(500 * 2 ** attemptIndex, 5000),
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
