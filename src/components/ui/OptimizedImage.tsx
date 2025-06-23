
import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallback,
  onLoad,
  onError
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    // Сброс состояния при изменении src
    setImageState('loading');
    setImageSrc(null);

    if (!src) {
      console.log('🖼️ [OPTIMIZED_IMAGE] No src provided, showing fallback');
      setImageState('error');
      return;
    }

    // Проверяем валидность URL
    try {
      new URL(src);
    } catch {
      console.warn('🖼️ [OPTIMIZED_IMAGE] Invalid URL provided:', src);
      setImageState('error');
      onError?.();
      return;
    }

    console.log('🖼️ [OPTIMIZED_IMAGE] Loading image:', src);

    const img = new Image();
    
    const handleLoad = () => {
      console.log('✅ [OPTIMIZED_IMAGE] Image loaded successfully:', src);
      setImageSrc(src);
      setImageState('loaded');
      onLoad?.();
    };

    const handleError = () => {
      console.warn('❌ [OPTIMIZED_IMAGE] Failed to load image:', src);
      setImageState('error');
      onError?.();
    };

    img.onload = handleLoad;
    img.onerror = handleError;

    // Добавляем таймаут для очень медленных изображений
    const timeout = setTimeout(() => {
      if (imageState === 'loading') {
        console.warn('⏰ [OPTIMIZED_IMAGE] Image loading timeout:', src);
        handleError();
      }
    }, 10000); // 10 секунд таймаут

    img.src = src;

    return () => {
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError, imageState]);

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
        console.warn('🖼️ [OPTIMIZED_IMAGE] Image error after load:', imageSrc);
        setImageState('error');
      }}
    />
  );
};

export default OptimizedImage;
