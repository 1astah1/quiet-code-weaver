
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
  timeout = 10000
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    setImageState('loading');
    setImageSrc(null);

    if (!src) {
      setImageState('error');
      return;
    }

    // Преобразуем неправильные URL из /lovable-uploads/ в fallback
    let finalSrc = src;
    if (src.includes('/lovable-uploads/')) {
      console.warn('🖼️ [OPTIMIZED_IMAGE] Detected /lovable-uploads/ URL, using fallback:', src);
      setImageState('error');
      onError?.();
      return;
    }

    // Простая валидация URL
    try {
      new URL(finalSrc);
    } catch {
      console.warn('🖼️ [OPTIMIZED_IMAGE] Invalid URL:', finalSrc);
      setImageState('error');
      onError?.();
      return;
    }

    const img = new Image();
    
    const handleLoad = () => {
      console.log('🖼️ [OPTIMIZED_IMAGE] Image loaded successfully:', finalSrc);
      setImageSrc(finalSrc);
      setImageState('loaded');
      onLoad?.();
    };

    const handleError = () => {
      console.warn('🖼️ [OPTIMIZED_IMAGE] Image failed to load:', finalSrc);
      setImageState('error');
      onError?.();
    };

    img.onload = handleLoad;
    img.onerror = handleError;

    // Таймаут для медленных изображений
    const timeoutId = setTimeout(() => {
      if (imageState === 'loading') {
        console.warn('🖼️ [OPTIMIZED_IMAGE] Image load timeout:', finalSrc);
        handleError();
      }
    }, timeout);

    img.src = finalSrc;

    return () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError, timeout, imageState]);

  if (imageState === 'error' || !src) {
    return (
      <div className={`flex items-center justify-center bg-slate-700 ${className}`}>
        {fallback || (
          <div className="text-slate-400 text-center p-2">
            <div className="text-2xl mb-1">🎁</div>
            <div className="text-xs">Нет фото</div>
          </div>
        )}
      </div>
    );
  }

  if (imageState === 'loading') {
    return (
      <div className={`flex items-center justify-center bg-slate-700 animate-pulse ${className}`}>
        <div className="text-slate-400 p-2">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
          <div className="text-xs">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc!}
      alt={alt}
      className={`${className} transition-opacity duration-200`}
      loading="lazy"
      onError={() => {
        console.warn('🖼️ [OPTIMIZED_IMAGE] Image element error:', imageSrc);
        setImageState('error');
      }}
    />
  );
};

export default OptimizedImage;
