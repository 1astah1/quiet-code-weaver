
import { useState, useRef, useEffect } from 'react';
import { useImageCache } from '@/hooks/useImageCache';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onError?: () => void;
  priority?: boolean;
  placeholder?: string;
  timeout?: number;
}

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback, 
  onError,
  priority = false,
  placeholder,
  timeout = 8000
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [localError, setLocalError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { cachedUrl, isLoading, hasError } = useImageCache(isInView ? src : '', timeout);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setLocalError(true);
    onError?.();
  };

  const showError = hasError || localError;

  if (showError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader */}
      {!isLoaded && (isInView && isLoading) && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 via-slate-700/70 to-slate-800/50 animate-pulse rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        </div>
      )}

      {/* Placeholder */}
      {placeholder && !isLoaded && !showError && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-md scale-105 opacity-40"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      {(isInView && cachedUrl && !showError) && (
        <img
          src={cachedUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      
      {/* Loading indicator */}
      {!isLoaded && !showError && (isInView && isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error state */}
      {showError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <div className="text-xl mb-1">🖼️</div>
            <p className="text-xs text-gray-400">Ошибка загрузки</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
