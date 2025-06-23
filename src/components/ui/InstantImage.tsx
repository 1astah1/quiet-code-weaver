
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

  // Reset error state when src changes
  useEffect(() => {
    if (src) {
      console.log('🖼️ [INSTANT_IMAGE] Source changed, resetting error state:', src);
      setHasError(false);
    }
  }, [src]);

  const handleError = () => {
    console.log('❌ [INSTANT_IMAGE] Image failed to load:', src);
    setHasError(true);
    onError?.();
  };

  const handleLoad = () => {
    console.log('✅ [INSTANT_IMAGE] Image loaded successfully:', src);
  };

  // Show fallback immediately if no src or if error occurred
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

  // Show image immediately
  return (
    <img
      src={src}
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
