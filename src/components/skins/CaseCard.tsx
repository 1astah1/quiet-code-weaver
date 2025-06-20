
import { useState } from "react";
import { Coins, Eye, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CasePreviewModal from "@/components/skins/CasePreviewModal";

interface CaseCardProps {
  caseItem: {
    id: string;
    name: string;
    description: string;
    price: number;
    is_free: boolean;
    image_url: string | null;
    cover_image_url?: string | null;
    likes_count: number;
  };
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onOpen: (caseItem: any) => void;
  onCoinsUpdate: (newCoins: number) => void;
}

const CaseCard = ({ caseItem, currentUser, onOpen, onCoinsUpdate }: CaseCardProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleOpen = () => {
    if (!caseItem.is_free && currentUser.coins < caseItem.price) {
      toast({
        title: "Недостаточно монет",
        description: `Для открытия кейса нужно ${caseItem.price} монет`,
        variant: "destructive",
      });
      return;
    }

    onOpen(caseItem);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <>
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-600/50 overflow-hidden hover:border-orange-500/50 transition-all duration-300 group">
        {/* Case Image */}
        <div className="relative aspect-video bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
          {caseItem.image_url ? (
            <img
              src={caseItem.image_url}
              alt={caseItem.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-slate-500" />
            </div>
          )}
          
          {/* Free badge */}
          {caseItem.is_free && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
              БЕСПЛАТНО
            </div>
          )}
        </div>

        {/* Case Info */}
        <div className="p-3 sm:p-4">
          <h3 className="text-white font-bold text-sm sm:text-lg mb-2 line-clamp-2">{caseItem.name}</h3>
          
          {/* Price */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">₽</span>
              </div>
              <span className="text-orange-400 font-bold text-sm sm:text-base">
                {caseItem.is_free ? 'Бесплатно' : caseItem.price}
              </span>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <span>❤️ {caseItem.likes_count}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleOpen}
              disabled={!caseItem.is_free && currentUser.coins < caseItem.price}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 text-xs sm:text-sm py-2 sm:py-3"
            >
              <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Открыть
            </Button>
            
            <Button
              onClick={handlePreview}
              variant="outline"
              className="flex-1 sm:flex-none border-slate-600 text-slate-300 hover:text-white hover:border-orange-500/50 text-xs sm:text-sm py-2 sm:py-3"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Содержимое</span>
              <span className="sm:hidden">👁️</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <CasePreviewModal
          caseItem={caseItem}
          caseSkins={[]}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default CaseCard;
