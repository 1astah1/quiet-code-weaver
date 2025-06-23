
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

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      console.log('🖼️ [INSTANT_IMAGE] Source changed:', src);
      setHasError(false);
      setIsLoading(true);
    }
  }, [src]);

  const handleError = () => {
    console.log('❌ [INSTANT_IMAGE] Image failed to load:', src);
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    console.log('✅ [INSTANT_IMAGE] Image loaded successfully:', src);
    setIsLoading(false);
    setHasError(false);
  };

  // Show fallback if no src, error occurred, or for problematic URLs
  if (!src || hasError) {
    console.log('🔄 [INSTANT_IMAGE] Showing fallback for:', src, 'hasError:', hasError);
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

  // Show image with loading state
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300">
          <div className="text-sm">Загрузка...</div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        decoding="sync"
      />
    </div>
  );
};

export default InstantImage;
