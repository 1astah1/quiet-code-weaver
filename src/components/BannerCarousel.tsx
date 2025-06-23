import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { Screen } from "@/components/MainApp";

interface BannerCarouselProps {
  onBannerAction: (action: Screen) => void;
}

const BannerCarousel = ({ onBannerAction }: BannerCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();

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

  // Автоскролл каждые 5 секунд
  useEffect(() => {
    if (!api || !banners || banners.length <= 1) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api, banners]);

  const handleBannerAction = (action: string) => {
    switch (action) {
      case 'shop':
      case 'cases':
        onBannerAction('skins');
        break;
      case 'tasks':
        onBannerAction('tasks');
        break;
      case 'quiz':
        onBannerAction('quiz');
        break;
      default:
        onBannerAction('skins');
    }
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <Carousel 
        setApi={setApi}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 overflow-hidden">
                {/* Background Image using OptimizedImage */}
                {banner.image_url && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <OptimizedImage
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover opacity-30"
                      fallback={
                        <div className="w-full h-full bg-gradient-to-r from-orange-600 to-red-600" />
                      }
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {banner.title}
                  </h2>
                  <p className="text-orange-100 mb-4 text-sm">
                    {banner.description}
                  </p>
                  <button
                    onClick={() => handleBannerAction(banner.button_action)}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-semibold transition-all"
                  >
                    {banner.button_text}
                  </button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default BannerCarousel;
