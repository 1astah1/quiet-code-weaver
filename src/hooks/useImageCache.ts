
import { useState, useEffect, useRef } from 'react';

interface ImageCacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
}

class ImageCache {
  private cache = new Map<string, ImageCacheEntry>();
  private maxSize = 30;
  private maxAge = 20 * 60 * 1000; // 20 минут

  async get(url: string): Promise<string | null> {
    const entry = this.cache.get(url);
    
    if (!entry) return null;
    
    // Проверяем, не устарело ли изображение
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(url);
      URL.revokeObjectURL(entry.url);
      return null;
    }
    
    return entry.url;
  }

  async set(originalUrl: string, blob: Blob): Promise<string> {
    // Если кэш переполнен, удаляем старые записи
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      const oldEntry = this.cache.get(oldestKey);
      if (oldEntry) {
        URL.revokeObjectURL(oldEntry.url);
        this.cache.delete(oldestKey);
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    this.cache.set(originalUrl, {
      url: objectUrl,
      blob,
      timestamp: Date.now()
    });

    return objectUrl;
  }

  clear() {
    this.cache.forEach(entry => {
      URL.revokeObjectURL(entry.url);
    });
    this.cache.clear();
  }

  getSize() {
    return this.cache.size;
  }
}

const imageCache = new ImageCache();

export const useImageCache = (src: string, timeout: number = 8000) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!src) return;

    // Простая валидация URL
    try {
      new URL(src);
    } catch {
      console.warn('📸 [IMAGE_CACHE] Invalid URL, using original:', src);
      setCachedUrl(src);
      return;
    }

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Отменяем предыдущий запрос
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        
        // Проверяем кэш
        const cached = await imageCache.get(src);
        if (cached) {
          setCachedUrl(cached);
          setIsLoading(false);
          return;
        }

        // Устанавливаем таймаут
        timeoutRef.current = setTimeout(() => {
          abortControllerRef.current?.abort();
          setHasError(true);
          setIsLoading(false);
        }, timeout);

        // Загружаем изображение
        const response = await fetch(src, {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'max-age=3600'
          }
        });
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        const objectUrl = await imageCache.set(src, blob);
        
        setCachedUrl(objectUrl);
      } catch (error: any) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        if (error.name === 'AbortError') {
          return;
        }
        
        // При ошибке используем оригинальный URL как fallback
        setHasError(true);
        setCachedUrl(src);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src, timeout]);

  return { cachedUrl, isLoading, hasError };
};

export { imageCache };
