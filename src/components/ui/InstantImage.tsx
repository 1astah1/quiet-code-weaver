
import React, { useState } from 'react';

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

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Show fallback immediately if no src or if error occurred
  if (!src || hasError) {
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
      loading="eager"
      decoding="sync"
    />
  );
};

export default InstantImage;
