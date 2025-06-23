
import React, { useState, useEffect } from 'react';

interface InstantImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onError?: () => void;
}

const InstantImage: React.FC<InstantImageProps> = ({
  src,
  alt,
  className = '',
  fallback,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);

  console.log('🖼️ [INSTANT_IMAGE] Rendering:', { 
    src, 
    alt, 
    hasError, 
    isLoading 
  });

  // Reset states when src changes
  useEffect(() => {
    console.log('🔄 [INSTANT_IMAGE] Source changed:', { src, alt });
    
    if (src) {
      setHasError(false);
      setIsLoading(true);
    } else {
      setHasError(false);
      setIsLoading(false);
    }
  }, [src, alt]);

  const handleError = () => {
    console.log('❌ [INSTANT_IMAGE] Image failed to load:', { src, alt });
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    console.log('✅ [INSTANT_IMAGE] Image loaded successfully:', { src, alt });
    setIsLoading(false);
    setHasError(false);
  };

  // Show fallback if no src, error, or loading failed
  if (!src || hasError) {
    console.log('🔄 [INSTANT_IMAGE] Showing fallback:', { 
      src, 
      hasError, 
      alt 
    });
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {fallback || (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300">
            <div className="text-2xl mb-1">🖼️</div>
            <div className="text-xs font-medium">Изображение</div>
          </div>
        )}
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-600 to-slate-700 text-slate-300">
          <div className="text-2xl mb-1 animate-pulse">⏳</div>
          <div className="text-xs font-medium">Загрузка...</div>
        </div>
      </div>
    );
  }

  // Show image
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      loading="eager"
      decoding="async"
    />
  );
};

export default InstantImage;
