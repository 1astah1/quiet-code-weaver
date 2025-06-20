
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Banner = Database['public']['Tables']['banners']['Row'];

interface BannerCarouselProps {
  onBannerAction: (action: string) => void;
}

const BannerCarousel = ({ onBannerAction }: BannerCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      if (error) throw error;
      return data;
    }
  });

  const activeBanners = banners || [];

  useEffect(() => {
    if (activeBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeBanners.length]);

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  if (!activeBanners.length) {
    return (
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-2">FastMarket CASE CS2</h2>
          <p className="text-orange-100 mb-4">Открывай кейсы, получай скины!</p>
          <button 
            onClick={() => onBannerAction('cases')}
            className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-2 text-white font-semibold hover:bg-white/30 transition-all"
          >
            Открыть кейсы 🎁
          </button>
        </div>
      </div>
    );
  }

  const currentBanner = activeBanners[currentIndex];

  return (
    <div className="relative mb-6 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 relative overflow-hidden">
        {currentBanner.image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentBanner.image_url})` }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        )}
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-2">{currentBanner.title}</h2>
          <p className="text-orange-100 mb-4">{currentBanner.description}</p>
          {currentBanner.button_text && (
            <button 
              onClick={() => onBannerAction(currentBanner.button_action)}
              className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-2 text-white font-semibold hover:bg-white/30 transition-all"
            >
              {currentBanner.button_text}
            </button>
          )}
        </div>
      </div>

      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prevBanner}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {activeBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerCarousel;
