
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface BannerCarouselProps {
  onBannerAction: (action: string) => void;
}

const BannerCarousel = ({ onBannerAction }: BannerCarouselProps) => {
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

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <Carousel 
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
                {/* Background Image */}
                {banner.image_url && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url(${banner.image_url})` }}
                  />
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
                    onClick={() => onBannerAction(banner.button_action)}
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
