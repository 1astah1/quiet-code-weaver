
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
    if (!src) {
      setImageState('error');
      return;
    }

    setImageState('loading');
    setImageSrc(null);

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setImageState('loaded');
      onLoad?.();
    };

    img.onerror = () => {
      console.warn('🖼️ [OPTIMIZED_IMAGE] Failed to load image:', src);
      setImageState('error');
      onError?.();
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);

  if (imageState === 'error' || !src) {
    return (
      <div className={`flex items-center justify-center bg-slate-700 ${className}`}>
        {fallback || (
          <div className="text-slate-400 text-center">
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
        <div className="text-slate-400">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc!}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
};

export default OptimizedImage;
