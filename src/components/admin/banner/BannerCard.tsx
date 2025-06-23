
import { Edit, Trash2, Image } from "lucide-react";
import InstantImage from "@/components/ui/InstantImage";
import type { Banner } from "@/utils/supabaseTypes";

interface BannerCardProps {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
}

const BannerCard = ({ banner, onEdit, onDelete }: BannerCardProps) => {
  const BannerThumbnailFallback = () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500">
      <Image className="w-6 h-6 text-white" />
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
              <InstantImage
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover"
                fallback={<BannerThumbnailFallback />}
              />
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-semibold">{banner.title}</h3>
              <p className="text-gray-400 text-sm">{banner.description}</p>
              <p className="text-gray-500 text-xs">Кнопка: {banner.button_text}</p>
              <p className="text-gray-500 text-xs">Действие: {banner.button_action}</p>
              <p className="text-gray-500 text-xs">Порядок: {banner.order_index}</p>
              <p className={`text-xs ${banner.is_active ? 'text-green-400' : 'text-red-400'}`}>
                {banner.is_active ? 'Активен' : 'Неактивен'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(banner)}
            className="text-blue-400 hover:text-blue-300"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(banner.id)}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerCard;
