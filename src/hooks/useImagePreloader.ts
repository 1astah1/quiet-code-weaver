
import { useEffect } from 'react';

interface PreloadOptions {
  priority?: boolean;
  sizes?: string[];
}

export const useImagePreloader = (urls: string[], options: PreloadOptions = {}) => {
  const { priority = false, sizes = ['400', '800'] } = options;

  useEffect(() => {
    if (!urls.length) return;

    console.log('🚀 [IMAGE_PRELOADER] Starting preload for', urls.length, 'images');

    const preloadPromises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        
        // Создаем srcset для адаптивных изображений
        if (url.includes('supabase') && url.includes('storage')) {
          const srcset = sizes.map(size => {
            const preloadUrl = new URL(url);
            preloadUrl.searchParams.set('width', size);
            preloadUrl.searchParams.set('quality', '85');
            preloadUrl.searchParams.set('format', 'webp');
            return `${preloadUrl.toString()} ${size}w`;
          }).join(', ');
          
          img.srcset = srcset;
        }
        
        img.src = url;
        img.onload = () => {
          console.log('✅ [IMAGE_PRELOADER] Preloaded:', url);
          resolve();
        };
        img.onerror = () => {
          console.warn('⚠️ [IMAGE_PRELOADER] Failed to preload:', url);
          resolve(); // Не блокируем другие изображения
        };
      });
    });

    // Если это приоритетные изображения, добавляем link preload в head
    if (priority) {
      urls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.type = 'image/webp';
        document.head.appendChild(link);
      });
    }

    Promise.allSettled(preloadPromises).then(() => {
      console.log('🎉 [IMAGE_PRELOADER] All preloads completed');
    });

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

// Хук для предзагрузки критических изображений в компонентах
export const useCriticalImagePreloader = () => {
  useEffect(() => {
    // Предзагружаем важные изображения сразу при загрузке приложения
    const criticalImages = [
      '/lovable-uploads/47a122b5-c1e7-44cd-af3e-d4ae59ce6838.png', // Main icon
      '/lovable-uploads/7872de96-7d2a-441b-a062-58e9068a686b.png', // Cases icon
      '/lovable-uploads/60a00c47-4bb3-4bb2-b7f0-01299fbde885.png', // Quiz icon
      '/lovable-uploads/bc1fd348-a889-4ecf-8b2a-d806d4a84459.png'  // Tasks icon
    ];

    console.log('⚡ [CRITICAL_PRELOADER] Preloading critical images...');
    
    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
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
