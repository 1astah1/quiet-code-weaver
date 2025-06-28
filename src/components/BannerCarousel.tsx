import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import InstantImage from "@/components/ui/InstantImage";
import type { Banner } from "@/utils/supabaseTypes";

interface BannerCarouselProps {
  onBannerAction?: (action: string) => void;
}

const BannerCarousel = ({ onBannerAction }: BannerCarouselProps) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        console.log('🎯 [BANNER_CAROUSEL] Fetching banners...');
        setIsLoading(true);
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (error) {
          console.error('❌ [BANNER_CAROUSEL] Error fetching banners:', error);
          return;
        }

        console.log('✅ [BANNER_CAROUSEL] Banners loaded:', data?.length || 0);
        if (data && Array.isArray(data)) {
          // Convert null to undefined for compatibility with Banner type
          const convertedBanners: Banner[] = data.map(banner => ({
            ...banner,
            image_url: banner.image_url || undefined,
            is_active: banner.is_active ?? undefined,
            order_index: banner.order_index ?? undefined,
            created_at: banner.created_at || undefined
          }));
          setBanners(convertedBanners);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error('❌ [BANNER_CAROUSEL] Unexpected error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleBannerClick = (action: string) => {
    console.log('🎯 [BANNER_CAROUSEL] Banner button clicked with action:', action);
    if (onBannerAction) {
      onBannerAction(action);
    } else {
      console.warn('⚠️ [BANNER_CAROUSEL] No onBannerAction handler provided');
    }
  };

  // Безопасные функции навигации
  const nextSlide = useCallback(() => {
    if (banners.length <= 1) return;
    
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex >= banners.length - 1 ? 0 : prevIndex + 1;
      console.log('➡️ [BANNER_CAROUSEL] Next slide:', prevIndex, '->', newIndex);
      return newIndex;
    });
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length <= 1) return;
    
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex <= 0 ? banners.length - 1 : prevIndex - 1;
      console.log('⬅️ [BANNER_CAROUSEL] Previous slide:', prevIndex, '->', newIndex);
      return newIndex;
    });
  }, [banners.length]);

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= banners.length) return;
    console.log('🎯 [BANNER_CAROUSEL] Manual slide change:', index);
    setCurrentIndex(index);
  }, [banners.length]);

  // Автоматическое переключение слайдов - только если больше одного баннера
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [banners.length, nextSlide]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Загрузка
  if (isLoading) {
    return (
      <div className="relative w-full h-48 sm:h-64 md:h-80 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl animate-pulse">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-6 sm:p-8 md:p-12 text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white/90">Загрузка баннеров...</p>
        </div>
      </div>
    );
  }

  // Показываем баннер по умолчанию если нет данных
  if (banners.length === 0) {
    console.log('⚠️ [BANNER_CAROUSEL] No banners found, showing default');
    return (
      <div className="relative w-full h-48 sm:h-64 md:h-80 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-6 sm:p-8 md:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">
            FastMarket CASE CS2
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/90 mb-4 sm:mb-6">
            Открывай кейсы, получай скины!
          </p>
          <button 
            onClick={() => onBannerAction?.('cases')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
          >
            Открыть кейсы 🎁
          </button>
        </div>
      </div>
    );
  }

  // Безопасное получение текущего баннера с проверкой
  const safeCurrentIndex = Math.max(0, Math.min(currentIndex, banners.length - 1));
  const currentBanner = banners[safeCurrentIndex];

  if (!currentBanner) {
    console.error('❌ [BANNER_CAROUSEL] Current banner is undefined, showing default');
    return (
      <div className="relative w-full h-48 sm:h-64 md:h-80 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-6 sm:p-8 md:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">
            FastMarket CASE CS2
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/90 mb-4 sm:mb-6">
            Открывай кейсы, получай скины!
          </p>
          <button 
            onClick={() => onBannerAction?.('cases')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
          >
            Открыть кейсы 🎁
          </button>
        </div>
      </div>
    );
  }

  console.log('🎨 [BANNER_CAROUSEL] Rendering banner:', { 
    currentIndex: safeCurrentIndex, 
    bannerTitle: currentBanner.title,
    totalBanners: banners.length 
  });

  const BannerImageFallback = () => (
    <div className="w-full h-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-2">🎁</div>
        <p className="text-white font-semibold">FastMarket</p>
      </div>
    </div>
  );

  return (
    <div 
      className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden rounded-xl"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Banner Image */}
      <div className="absolute inset-0">
        <InstantImage
          src={currentBanner.image_url}
          alt={currentBanner.title}
          className="w-full h-full object-cover"
          fallback={<BannerImageFallback />}
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Banner Content */}
      <div className="relative z-10 flex flex-col justify-center items-start h-full p-6 sm:p-8 md:p-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">
          {currentBanner.title}
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-white/90 mb-4 sm:mb-6 max-w-md">
          {currentBanner.description}
        </p>
        <button 
          onClick={() => handleBannerClick(currentBanner.button_action)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
        >
          {currentBanner.button_text}
        </button>
      </div>

      {/* Indicators - только если больше одного баннера */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                index === safeCurrentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Слайд ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
