
import { useState, useEffect } from 'react';

interface ImageCacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
}

class ImageCache {
  private cache = new Map<string, ImageCacheEntry>();
  private maxSize = 50; // Максимальное количество изображений в кэше
  private maxAge = 30 * 60 * 1000; // 30 минут

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
}

const imageCache = new ImageCache();

export const useImageCache = (src: string) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!src) return;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        
        // Проверяем кэш
        const cached = await imageCache.get(src);
        if (cached) {
          console.log('💾 [IMAGE_CACHE] Using cached image:', src);
          setCachedUrl(cached);
          setIsLoading(false);
          return;
        }

        // Загружаем изображение
        console.log('📥 [IMAGE_CACHE] Fetching image:', src);
        const response = await fetch(src);
        
        if (!response.ok) throw new Error('Failed to fetch image');
        
        const blob = await response.blob();
        const objectUrl = await imageCache.set(src, blob);
        
        console.log('✅ [IMAGE_CACHE] Image cached:', src);
        setCachedUrl(objectUrl);
      } catch (error) {
        console.error('❌ [IMAGE_CACHE] Failed to load image:', error);
        setCachedUrl(src); // Fallback к оригинальному URL
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [src]);

  return { cachedUrl, isLoading };
};

export { imageCache };
