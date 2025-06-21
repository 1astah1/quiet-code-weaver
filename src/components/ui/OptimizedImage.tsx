
import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onError?: () => void;
  priority?: boolean;
  placeholder?: string;
  sizes?: string;
  timeout?: number; // Добавляем таймаут
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback, 
  onError,
  priority = false,
  placeholder,
  sizes = "100vw",
  timeout = 10000 // 10 секунд таймаут по умолчанию
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  // Создаем адаптивные URL для разных размеров
  const createResponsiveUrl = (originalSrc: string, width: number, quality: number = 80) => {
    if (originalSrc.includes('supabase') && originalSrc.includes('storage')) {
      const url = new URL(originalSrc);
      url.searchParams.set('width', width.toString());
      url.searchParams.set('quality', quality.toString());
      url.searchParams.set('format', 'webp');
      return url.toString();
    }
    return originalSrc;
  };

  // IntersectionObserver для ленивой загрузки
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          console.log('🖼️ [OPTIMIZED_IMAGE] Image in viewport:', src);
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  // Загрузка изображения с таймаутом
  useEffect(() => {
    if (!isInView || isLoaded || hasError) return;

    console.log('🚀 [OPTIMIZED_IMAGE] Starting image load:', src);
    setIsLoading(true);
    
    const img = new Image();
    imgElementRef.current = img;
    
    // Настройка таймаута
    timeoutRef.current = setTimeout(() => {
      console.warn('⏰ [OPTIMIZED_IMAGE] Image load timeout:', src);
      img.onload = null;
      img.onerror = null;
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }, timeout);

    img.onload = () => {
      console.log('✅ [OPTIMIZED_IMAGE] Image loaded successfully:', src);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsLoaded(true);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      console.error('❌ [OPTIMIZED_IMAGE] Image failed to load:', src);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };

    // Устанавливаем src последним для начала загрузки
    img.src = createResponsiveUrl(src, 800);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (imgElementRef.current) {
        imgElementRef.current.onload = null;
        imgElementRef.current.onerror = null;
      }
    };
  }, [isInView, src, timeout, onError]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      observerRef.current?.disconnect();
    };
  }, []);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader */}
      {!isLoaded && isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-700/30 via-slate-600/50 to-slate-700/30 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
        </div>
      )}
      
      {/* Placeholder blur */}
      {placeholder && !isLoaded && !hasError && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 opacity-50"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      {isInView && !hasError && (
        <img
          src={createResponsiveUrl(src, 800)}
          srcSet={`
            ${createResponsiveUrl(src, 400)} 400w,
            ${createResponsiveUrl(src, 800)} 800w,
            ${createResponsiveUrl(src, 1200)} 1200w
          `}
          sizes={sizes}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => {
            setIsLoaded(true);
            setIsLoading(false);
          }}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            onError?.();
          }}
        />
      )}
      
      {/* Error state */}
      {hasError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700/50">
          <div className="text-center">
            <div className="text-2xl mb-2">🖼️</div>
            <p className="text-xs text-gray-400">Не удалось загрузить</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
