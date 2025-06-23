
import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  timeout?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallback,
  onLoad,
  onError,
  timeout = 15000 // Увеличен timeout для Supabase Storage
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  useEffect(() => {
    setImageState('loading');
    setImageSrc(null);
    setRetryCount(0);

    if (!src) {
      console.log('🖼️ [OPTIMIZED_IMAGE] No src provided, showing fallback');
      setImageState('error');
      return;
    }

    loadImage(src);
  }, [src, timeout]);

  const loadImage = (imageSrc: string) => {
    // Улучшенная валидация URL для Supabase Storage
    let finalSrc = imageSrc;
    
    // Проверяем на некорректные локальные пути
    if (finalSrc.includes('/lovable-uploads/')) {
      console.warn('🖼️ [OPTIMIZED_IMAGE] Detected invalid /lovable-uploads/ URL, using fallback:', finalSrc);
      setImageState('error');
      onError?.();
      return;
    }

    // Простая валидация URL - должен быть либо data: либо http(s):
    if (!finalSrc.startsWith('http') && !finalSrc.startsWith('data:') && !finalSrc.startsWith('blob:')) {
      console.warn('🖼️ [OPTIMIZED_IMAGE] Invalid URL format:', finalSrc);
      setImageState('error');
      onError?.();
      return;
    }

    console.log('🖼️ [OPTIMIZED_IMAGE] Starting image load:', { src: finalSrc, timeout, retryCount });

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Для работы с Supabase Storage
    
    const handleLoad = () => {
      console.log('✅ [OPTIMIZED_IMAGE] Image loaded successfully:', finalSrc);
      clearTimeout(timeoutId);
      setImageSrc(finalSrc);
      setImageState('loaded');
      onLoad?.();
    };

    const handleError = (error?: Event) => {
      console.error('❌ [OPTIMIZED_IMAGE] Image failed to load:', { 
        src: finalSrc, 
        retryCount,
        error: error || 'Unknown error'
      });
      clearTimeout(timeoutId);
      
      // Пробуем retry только для сетевых ошибок
      if (retryCount < maxRetries && finalSrc.startsWith('http')) {
        console.log(`🔄 [OPTIMIZED_IMAGE] Retrying image load (${retryCount + 1}/${maxRetries}):`, finalSrc);
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadImage(finalSrc), 1000 * (retryCount + 1)); // Экспоненциальная задержка
        return;
      }
      
      setImageState('error');
      onError?.();
    };

    img.onload = handleLoad;
    img.onerror = handleError;

    // Таймаут с увеличенным временем для медленного интернета
    const timeoutId = setTimeout(() => {
      if (imageState === 'loading') {
        console.warn('⏰ [OPTIMIZED_IMAGE] Image load timeout after', timeout, 'ms:', finalSrc);
        img.onload = null;
        img.onerror = null;
        handleError();
      }
    }, timeout);

    img.src = finalSrc;
  };

  if (imageState === 'error' || !src) {
    return (
      <div className={`flex items-center justify-center bg-slate-700 ${className}`}>
        {fallback || (
          <div className="text-slate-400 text-center p-2">
            <div className="text-2xl mb-1">🖼️</div>
            <div className="text-xs">
              {retryCount > 0 ? 'Ошибка загрузки' : 'Нет фото'}
            </div>
            {retryCount > 0 && (
              <div className="text-xs text-red-400 mt-1">
                Попыток: {retryCount}/{maxRetries}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (imageState === 'loading') {
    return (
      <div className={`flex items-center justify-center bg-slate-700 animate-pulse ${className}`}>
        <div className="text-slate-400 p-2 text-center">
          <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-xs">Загрузка...</div>
          {retryCount > 0 && (
            <div className="text-xs text-yellow-400 mt-1">
              Попытка {retryCount + 1}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc!}
      alt={alt}
      className={`${className} transition-opacity duration-300`}
      loading="lazy"
      onError={(e) => {
        console.error('🖼️ [OPTIMIZED_IMAGE] IMG element error:', {
          src: imageSrc,
          error: e
        });
        setImageState('error');
      }}
    />
  );
};

export default OptimizedImage;
