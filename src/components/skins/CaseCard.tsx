import { useState } from "react";
import { Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CasePreviewModal from "@/components/skins/CasePreviewModal";
import FreeCaseTimer from "@/components/FreeCaseTimer";
import InstantImage from "@/components/ui/InstantImage";

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
    last_free_open?: string | null;
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
  const [canOpenFreeCase, setCanOpenFreeCase] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const { toast } = useToast();

  const handleOpen = async () => {
    if (isOpening) return;

    // Для бесплатных кейсов проверяем индивидуальный таймер
    if (caseItem.is_free) {
      if (!canOpenFreeCase) {
        toast({
          title: "Кейс недоступен",
          description: "Бесплатный кейс можно открыть только раз в 2 часа",
          variant: "destructive",
        });
        return;
      }

      setIsOpening(false);
      onOpen(caseItem);
      return;
    }

    // Для платных кейсов проверяем монеты
    if (currentUser.coins < caseItem.price) {
      toast({
        title: "Недостаточно монет",
        description: `Для открытия кейса нужно ${caseItem.price} монет`,
        variant: "destructive",
      });
      return;
    }

    setIsOpening(false);
    onOpen(caseItem);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleTimerComplete = () => {
    setCanOpenFreeCase(true);
  };

  // Используем cover_image_url если есть, иначе image_url
  const imageUrl = caseItem.cover_image_url || caseItem.image_url;

  const isDisabled = (!caseItem.is_free && currentUser.coins < caseItem.price) || 
                     (caseItem.is_free && !canOpenFreeCase) || 
                     isOpening;

  const CaseImageFallback = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300">
      <Package className="w-8 h-8 sm:w-12 sm:h-12 mb-2" />
      <span className="text-xs font-medium text-center px-2">
        {caseItem.name}
      </span>
    </div>
  );

  return (
    <>
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-600/50 overflow-hidden hover:border-orange-500/50 transition-all duration-300 group">
        {/* Case Image */}
        <div className="relative aspect-video bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
          <InstantImage
            src={imageUrl}
            alt={caseItem.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallback={<CaseImageFallback />}
          />
          
          {/* Free badge */}
          {caseItem.is_free && (
            <div className="absolute top-1 mobile-small:top-1.5 mobile-medium:top-2 mobile-large:top-2 sm:top-2 right-1 mobile-small:right-1.5 mobile-medium:right-2 mobile-large:right-2 sm:right-2 bg-green-500 text-white px-1.5 mobile-small:px-2 mobile-medium:px-2 mobile-large:px-2 sm:px-2 py-0.5 mobile-small:py-1 mobile-medium:py-1 mobile-large:py-1 sm:py-1 rounded-lg text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-xs font-bold">
              БЕСПЛАТНО
            </div>
          )}
        </div>

        {/* Case Info */}
        <div className="p-2 mobile-small:p-2.5 mobile-medium:p-3 mobile-large:p-3 sm:p-4">
          <h3 className="text-white font-bold text-xs mobile-small:text-sm mobile-medium:text-sm mobile-large:text-base sm:text-lg mb-1.5 mobile-small:mb-2 mobile-medium:mb-2 mobile-large:mb-2 sm:mb-2 line-clamp-2">{caseItem.name}</h3>
          
          {/* Price */}
          <div className="flex items-center justify-between mb-2 mobile-small:mb-3 mobile-medium:mb-3 mobile-large:mb-3 sm:mb-4">
            <div className="flex items-center space-x-0.5 mobile-small:space-x-1 mobile-medium:space-x-1 mobile-large:space-x-1 sm:space-x-2">
              <div className="w-3 h-3 mobile-small:w-4 mobile-small:h-4 mobile-medium:w-4 mobile-medium:h-4 mobile-large:w-5 mobile-large:h-5 sm:w-5 sm:h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-xs font-bold">₽</span>
              </div>
              <span className="text-orange-400 font-bold text-xs mobile-small:text-sm mobile-medium:text-sm mobile-large:text-sm sm:text-base">
                {caseItem.is_free ? 'Бесплатно' : caseItem.price}
              </span>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-1 mobile-small:space-x-1.5 mobile-medium:space-x-2 mobile-large:space-x-2 sm:space-x-2 text-slate-400 text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-xs">
              <span>❤️ {caseItem.likes_count || 0}</span>
            </div>
          </div>

          {/* Индивидуальный таймер для каждого бесплатного кейса */}
          {caseItem.is_free && (
            <FreeCaseTimer
              lastOpenTime={null}
              onTimerComplete={handleTimerComplete}
              isDisabled={!canOpenFreeCase}
              userId={currentUser.id}
              caseId={caseItem.id}
            />
          )}

          {/* Action Buttons */}
          <div className="flex flex-col mobile-small:flex-col mobile-medium:flex-row mobile-large:flex-row sm:flex-row gap-1.5 mobile-small:gap-2 mobile-medium:gap-2 mobile-large:gap-2 sm:gap-2">
            <Button
              onClick={handleOpen}
              disabled={isDisabled}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-sm py-1.5 mobile-small:py-2 mobile-medium:py-2 mobile-large:py-2.5 sm:py-3 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed"
            >
              <Package className="w-2.5 h-2.5 mobile-small:w-3 mobile-small:h-3 mobile-medium:w-3 mobile-medium:h-3 mobile-large:w-4 mobile-large:h-4 sm:w-4 sm:h-4 mr-0.5 mobile-small:mr-1 mobile-medium:mr-1 mobile-large:mr-1 sm:mr-2" />
              {isOpening ? 'Открываем...' : 
               caseItem.is_free && !canOpenFreeCase ? 'Ожидание' : 'Открыть'}
            </Button>
            
            <Button
              onClick={handlePreview}
              variant="outline"
              className="flex-1 mobile-small:flex-1 mobile-medium:flex-none mobile-large:flex-none sm:flex-none border-purple-500 bg-purple-500/10 text-purple-400 hover:text-purple-300 hover:border-purple-400 hover:bg-purple-500/20 text-[10px] mobile-small:text-xs mobile-medium:text-xs mobile-large:text-xs sm:text-sm py-1.5 mobile-small:py-2 mobile-medium:py-2 mobile-large:py-2.5 sm:py-3"
            >
              <Eye className="w-2.5 h-2.5 mobile-small:w-3 mobile-small:h-3 mobile-medium:w-3 mobile-medium:h-3 mobile-large:w-4 mobile-large:h-4 sm:w-4 sm:h-4 mr-0.5 mobile-small:mr-1 mobile-medium:mr-1 mobile-large:mr-1 sm:mr-2" />
              <span className="hidden mobile-small:inline mobile-medium:inline mobile-large:inline sm:inline">Содержимое</span>
              <span className="mobile-small:hidden mobile-medium:hidden mobile-large:hidden sm:hidden">👁️</span>
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
