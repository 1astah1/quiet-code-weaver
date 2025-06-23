
import { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        console.log('🎯 [BANNER_CAROUSEL] Fetching banners...');
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
          setBanners(data);
        }
      } catch (error) {
        console.error('❌ [BANNER_CAROUSEL] Unexpected error:', error);
      }
    };

    fetchBanners();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

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

  // Show default banner immediately if no banners
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

  const currentBanner = banners[currentIndex];

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
      className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden rounded-xl group"
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
          onClick={() => onBannerAction?.(currentBanner.button_action)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
        >
          {currentBanner.button_text}
        </button>
      </div>

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
