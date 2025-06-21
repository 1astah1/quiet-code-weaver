
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onError?: () => void;
}

const OptimizedImage = ({ src, alt, className = '', fallback, onError }: OptimizedImageProps) => {
  console.log('🖼️ [OPTIMIZED_IMAGE] Component mounting:', { src, alt, hasClassName: !!className, hasFallback: !!fallback });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    console.log('✅ [OPTIMIZED_IMAGE] Image loaded successfully:', src);
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error('❌ [OPTIMIZED_IMAGE] Image failed to load:', src);
    setHasError(true);
    onError?.();
  };

  if (hasError && fallback) {
    console.log('🔄 [OPTIMIZED_IMAGE] Showing fallback for:', src);
    return <>{fallback}</>;
  }

  console.log('🎨 [OPTIMIZED_IMAGE] Rendering image:', { src, isLoaded, hasError });

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-700/50 animate-pulse rounded-lg flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};

export default OptimizedImage;
