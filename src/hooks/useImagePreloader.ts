
import { useEffect } from 'react';

interface PreloadOptions {
  priority?: boolean;
  sizes?: string[];
}

export const useImagePreloader = (urls: string[], options: PreloadOptions = {}) => {
  const { priority = false, sizes = ['400', '800'] } = options;

  useEffect(() => {
    if (!urls.length) return;

    console.log('🚀 [IMAGE_PRELOADER] Starting instant preload for', urls.length, 'images');

    // Предзагружаем изображения без ожидания результата для мгновенного отображения
    urls.forEach(url => {
      if (!url) return;
      
      const img = new Image();
      img.src = url;
      
      // Если это Supabase URL, создаем также WebP версию
      if (url.includes('supabase') && url.includes('storage')) {
        const webpImg = new Image();
        const webpUrl = new URL(url);
        webpUrl.searchParams.set('format', 'webp');
        webpImg.src = webpUrl.toString();
      }
    });

    // Для приоритетных изображений добавляем preload links
    if (priority) {
      urls.forEach(url => {
        if (!url) return;
        
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.fetchPriority = 'high';
        document.head.appendChild(link);
      });
    }

    console.log('✅ [IMAGE_PRELOADER] Instant preload initiated');

    // Cleanup для priority links
    return () => {
      if (priority) {
        const links = document.querySelectorAll('link[rel="preload"][as="image"]');
        links.forEach(link => {
          if (urls.includes(link.getAttribute('href') || '')) {
            document.head.removeChild(link);
          }
        });
      }
    };
  }, [urls, priority, sizes]);
};

// Хук для предзагрузки критических изображений
export const useCriticalImagePreloader = () => {
  useEffect(() => {
    // Предзагружаем важные изображения агрессивно для мгновенного отображения
    const criticalImages = [
      '/lovable-uploads/47a122b5-c1e7-44cd-af3e-d4ae59ce6838.png', // Main icon
      '/lovable-uploads/7872de96-7d2a-441b-a062-58e9068a686b.png', // Cases icon
      '/lovable-uploads/60a00c47-4bb3-4bb2-b7f0-01299fbde885.png', // Quiz icon
      '/lovable-uploads/bc1fd348-a889-4ecf-8b2a-d806d4a84459.png'  // Tasks icon
    ];

    console.log('⚡ [CRITICAL_PRELOADER] Instant loading critical images...');
    
    criticalImages.forEach(src => {
      // Создаем preload link
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      
      // Также загружаем через Image для кеширования
      const img = new Image();
      img.src = src;
    });

    return () => {
      const links = document.querySelectorAll('link[rel="preload"][as="image"]');
      links.forEach(link => {
        if (criticalImages.includes(link.getAttribute('href') || '')) {
          document.head.removeChild(link);
        }
      });
    };
  }, []);
};
