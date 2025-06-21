
import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onError?: () => void;
  priority?: boolean; // Для критических изображений
  placeholder?: string; // Base64 placeholder
  sizes?: string; // Для адаптивных изображений
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback, 
  onError,
  priority = false,
  placeholder,
  sizes = "100vw"
}: OptimizedImageProps) => {
  console.log('🖼️ [OPTIMIZED_IMAGE] Component mounting:', { src, alt, priority });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Если priority=true, загружаем сразу
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Создаем адаптивные URL для разных размеров
  const createResponsiveUrl = (originalSrc: string, width: number, quality: number = 80) => {
    // Если это Supabase Storage URL, добавляем параметры трансформации
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
          console.log('📱 [OPTIMIZED_IMAGE] Image in viewport:', src);
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Начинаем загрузку за 50px до появления
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  // Загрузка изображения когда оно попадает в viewport
  useEffect(() => {
    if (!isInView || isLoaded || hasError) return;

    console.log('🚀 [OPTIMIZED_IMAGE] Starting image load:', src);
    
    const img = new Image();
    
    // Создаем srcset для адаптивных изображений
    const srcset = [
      `${createResponsiveUrl(src, 400)} 400w`,
      `${createResponsiveUrl(src, 800)} 800w`,
      `${createResponsiveUrl(src, 1200)} 1200w`
    ].join(', ');

    img.srcset = srcset;
    img.src = createResponsiveUrl(src, 800); // Fallback URL
    img.sizes = sizes;
    
    img.onload = () => {
      console.log('✅ [OPTIMIZED_IMAGE] Image loaded successfully:', src);
      setImageUrl(img.src);
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      console.error('❌ [OPTIMIZED_IMAGE] Image failed to load:', src);
      setHasError(true);
      onError?.();
    };

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, src, sizes]);

  // Предзагрузка критических изображений
  useEffect(() => {
    if (priority && src) {
      console.log('⚡ [OPTIMIZED_IMAGE] Preloading priority image:', src);
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = createResponsiveUrl(src, 800);
      link.type = 'image/webp';
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src]);

  if (hasError && fallback) {
    console.log('🔄 [OPTIMIZED_IMAGE] Showing fallback for:', src);
    return <>{fallback}</>;
  }

  console.log('🎨 [OPTIMIZED_IMAGE] Rendering image:', { 
    src, 
    isLoaded, 
    hasError, 
    isInView,
    hasImageUrl: !!imageUrl 
  });

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-700/30 via-slate-600/50 to-slate-700/30 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
        </div>
      )}
      
      {/* Placeholder blur */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 opacity-50"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      {isInView && (
        <img
          src={imageUrl || createResponsiveUrl(src, 800)}
          srcSet={`
            ${createResponsiveUrl(src, 400)} 400w,
            ${createResponsiveUrl(src, 800)} 800w,
            ${createResponsiveUrl(src, 1200)} 1200w
          `}
          sizes={sizes}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
        />
      )}
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
