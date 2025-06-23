
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

    // Простая валидация URL
    try {
      new URL(src);
    } catch {
      setImageState('error');
      onError?.();
      return;
    }

    const img = new Image();
    
    const handleLoad = () => {
      setImageSrc(src);
      setImageState('loaded');
      onLoad?.();
    };

    const handleError = () => {
      setImageState('error');
      onError?.();
    };

    img.onload = handleLoad;
    img.onerror = handleError;

    // Таймаут для медленных изображений
    const timeoutId = setTimeout(() => {
      if (imageState === 'loading') {
        handleError();
      }
    }, timeout);

    img.src = src;

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
      onError={() => setImageState('error')}
    />
  );
};

export default OptimizedImage;
