
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
  sizes?: string;
}

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback, 
  onError,
  priority = false,
  placeholder,
  sizes = "100vw"
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { cachedUrl, isLoading: isCaching } = useImageCache(isInView ? src : '');

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          console.log('👀 [LAZY_IMAGE] Image entering viewport:', src);
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Начинаем загрузку за 100px
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [src, priority]);

  const handleLoad = () => {
    console.log('✅ [LAZY_IMAGE] Image loaded:', src);
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error('❌ [LAZY_IMAGE] Image error:', src);
    setHasError(true);
    onError?.();
  };

  const createResponsiveUrl = (originalSrc: string, width: number) => {
    if (originalSrc.includes('supabase') && originalSrc.includes('storage')) {
      const url = new URL(originalSrc);
      url.searchParams.set('width', width.toString());
      url.searchParams.set('quality', '85');
      url.searchParams.set('format', 'webp');
      return url.toString();
    }
    return originalSrc;
  };

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader */}
      {!isLoaded && (isInView || isCaching) && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 via-slate-700/70 to-slate-800/50 animate-pulse rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
        </div>
      )}

      {/* Placeholder */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-md scale-105 opacity-40"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      {(isInView && cachedUrl) && (
        <img
          src={cachedUrl}
          srcSet={`
            ${createResponsiveUrl(cachedUrl, 400)} 400w,
            ${createResponsiveUrl(cachedUrl, 800)} 800w,
            ${createResponsiveUrl(cachedUrl, 1200)} 1200w
          `}
          sizes={sizes}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && (isInView || isCaching) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
