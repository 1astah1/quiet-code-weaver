
import { useState } from "react";
import { Coins, Heart, Play, Lock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CaseCardProps {
  caseData: {
    id: string;
    name: string;
    description?: string;
    price: number;
    cover_image_url?: string;
    likes_count?: number;
    is_free?: boolean;
  };
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCaseSelect: (caseData: any) => void;
  onCoinsUpdate: (newCoins: number) => void;
  disabled?: boolean;
  onFreeOpen?: () => void;
}

const CaseCard = ({ 
  caseData, 
  currentUser, 
  onCaseSelect, 
  onCoinsUpdate,
  disabled = false,
  onFreeOpen
}: CaseCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();

  const handleCaseClick = () => {
    if (disabled && caseData.is_free) {
      toast({
        title: "Кейс недоступен",
        description: "Подождите до окончания таймера",
        variant: "destructive"
      });
      return;
    }

    if (caseData.is_free && onFreeOpen) {
      onFreeOpen();
    }
    
    onCaseSelect(caseData);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const canAfford = currentUser.coins >= caseData.price;
  const isClickable = !disabled && (caseData.is_free || canAfford);

  return (
    <div className={`group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden transition-all duration-300 backdrop-blur-sm ${
      isClickable 
        ? 'hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10' 
        : 'opacity-60'
    }`}>
      {/* Compact Cover Image */}
      <div className="relative h-28 bg-gradient-to-br from-slate-700 to-slate-800">
        {caseData.cover_image_url ? (
          <img 
            src={caseData.cover_image_url} 
            alt={caseData.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-3xl opacity-30">📦</div>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Compact badges */}
        <div className="absolute top-2 right-2 flex gap-1">
          {caseData.is_free ? (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
              {disabled ? <Lock className="w-3 h-3" /> : <Star className="w-3 h-3" />}
              <span className="hidden sm:inline">FREE</span>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span className="hidden sm:inline">VIP</span>
            </div>
          )}
        </div>

        {/* Like button */}
        <button
          onClick={handleLike}
          className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-1.5 rounded-full transition-all duration-200 hover:scale-110"
        >
          <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <Play className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Compact Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-sm font-bold text-white mb-1 group-hover:text-orange-400 transition-colors truncate" title={caseData.name}>
          {caseData.name}
        </h3>

        {/* Stats row */}
        <div className="flex items-center justify-between mb-2">
          {/* Price */}
          <div className="flex items-center space-x-1">
            {caseData.is_free ? (
              <span className="text-green-400 font-bold text-xs">БЕСПЛАТНО</span>
            ) : (
              <>
                <Coins className="w-3 h-3 text-orange-400" />
                <span className={`font-bold text-xs ${canAfford ? 'text-orange-400' : 'text-red-400'}`}>
                  {caseData.price}
                </span>
              </>
            )}
          </div>

          {/* Likes */}
          <div className="flex items-center space-x-1 text-slate-400">
            <Heart className="w-3 h-3" />
            <span className="text-xs">{caseData.likes_count || 0}</span>
          </div>
        </div>

        {/* Compact open button */}
        <button
          onClick={handleCaseClick}
          disabled={!isClickable}
          className={`w-full py-2 rounded-lg font-bold text-white transition-all duration-300 text-xs flex items-center justify-center gap-1 ${
            isClickable
              ? caseData.is_free
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md'
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          {disabled ? (
            <>
              <Lock className="w-3 h-3" />
              <span>Заблокировано</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              <span>Открыть</span>
            </>
          )}
        </button>
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
    </div>
  );
};

export default CaseCard;
