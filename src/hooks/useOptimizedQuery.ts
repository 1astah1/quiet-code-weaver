
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  debounceMs?: number;
  retryOnSlowConnection?: boolean;
}

export const useOptimizedQuery = <T>({
  queryKey,
  queryFn,
  debounceMs = 300,
  retryOnSlowConnection = true,
  ...options
}: OptimizedQueryOptions<T>) => {
  const [debouncedKey, setDebouncedKey] = useState(queryKey);

  // Debounce query key changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKey(queryKey);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [queryKey, debounceMs]);

  return useQuery({
    queryKey: debouncedKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (retryOnSlowConnection && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};
