
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
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Reset error state and loading when src changes
  useEffect(() => {
    console.log('🖼️ [INSTANT_IMAGE] Source changed:', { 
      oldSrc: currentSrc, 
      newSrc: src, 
      alt 
    });
    
    if (src && src !== currentSrc) {
      setHasError(false);
      setIsLoading(true);
      setCurrentSrc(src);
    } else if (!src) {
      setHasError(false);
      setIsLoading(false);
      setCurrentSrc(null);
    }
  }, [src, currentSrc, alt]);

  const handleError = () => {
    console.log('❌ [INSTANT_IMAGE] Image failed to load:', { src: currentSrc, alt });
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    console.log('✅ [INSTANT_IMAGE] Image loaded successfully:', { src: currentSrc, alt });
    setIsLoading(false);
    setHasError(false);
  };

  // Show fallback immediately if no src or if error occurred
  if (!currentSrc || hasError) {
    console.log('🔄 [INSTANT_IMAGE] Showing fallback for:', { 
      src: currentSrc, 
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
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      loading="eager"
      decoding="sync"
    />
  );
};

export default InstantImage;
