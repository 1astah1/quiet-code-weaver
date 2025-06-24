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
  fallback = <div style={{width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa'}}>Нет изображения</div>,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageKey, setImageKey] = useState(0); // Force refresh key

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      console.log('🖼️ [INSTANT_IMAGE] Source changed:', src);
      setHasError(false);
      setIsLoading(true);
      setImageKey(prev => prev + 1); // Force refresh
    } else {
      setIsLoading(false);
    }
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('❌ [INSTANT_IMAGE] Image failed to load:', src);
    console.log('❌ [INSTANT_IMAGE] Error details:', e.currentTarget.naturalWidth, e.currentTarget.naturalHeight);
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('✅ [INSTANT_IMAGE] Image loaded successfully:', src);
    console.log('✅ [INSTANT_IMAGE] Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight);
    setIsLoading(false);
    setHasError(false);
  };

  // Check if URL is likely invalid (points to non-existent static files)
  const isInvalidStaticPath = src && (
    src.startsWith('/lovable-uploads/') || 
    src.startsWith('./lovable-uploads/') ||
    (src.includes('lovable-uploads/') && !src.includes('supabase'))
  );

  // Check if it's a valid Supabase URL
  const isSupabaseUrl = src && (
    src.includes('supabase') ||
    src.includes('storage/v1/object/public/')
  );

  // Show fallback if no src, error occurred, or for invalid static paths (but not Supabase URLs)
  if (!src || hasError || (isInvalidStaticPath && !isSupabaseUrl)) {
    console.log('🔄 [INSTANT_IMAGE] Showing fallback for:', src, 'hasError:', hasError, 'isInvalidStaticPath:', isInvalidStaticPath, 'isSupabaseUrl:', isSupabaseUrl);
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {fallback || (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 rounded">
            <div className="text-2xl mb-1">🖼️</div>
            <div className="text-xs font-medium">Изображение</div>
          </div>
        )}
      </div>
    );
  }

  // Add cache busting parameter for fresh images
  const imageUrl = src.includes('?') ? `${src}&t=${Date.now()}` : `${src}?t=${Date.now()}`;

  // Show image with loading state
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 rounded z-10">
          <div className="text-sm">Загрузка...</div>
        </div>
      )}
      <img
        key={imageKey} // Force re-render when key changes
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        decoding="sync"
        crossOrigin="anonymous" // Help with CORS issues
      />
    </div>
  );
};

export default InstantImage;
