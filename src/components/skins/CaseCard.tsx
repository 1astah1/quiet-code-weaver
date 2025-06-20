
import { useState } from "react";
import { Coins, Heart, Play, Lock } from "lucide-react";
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
    <div className={`group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden transition-all duration-300 ${
      isClickable 
        ? 'hover:scale-105 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20' 
        : 'opacity-50'
    }`}>
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800">
        {caseData.cover_image_url ? (
          <img 
            src={caseData.cover_image_url} 
            alt={caseData.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl opacity-30">📦</div>
          </div>
        )}
        
        {/* Overlay effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Badge */}
        {caseData.is_free ? (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            {disabled ? <Lock className="w-3 h-3" /> : "БЕСПЛАТНО"}
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            ПРЕМИУМ
          </div>
        )}

        {/* Like button */}
        <button
          onClick={handleLike}
          className="absolute top-3 left-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
            <Play className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
          {caseData.name}
        </h3>

        {/* Description */}
        {caseData.description && (
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">
            {caseData.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          {/* Price */}
          <div className="flex items-center space-x-2">
            {caseData.is_free ? (
              <span className="text-green-400 font-bold text-lg">БЕСПЛАТНО</span>
            ) : (
              <>
                <Coins className="w-5 h-5 text-orange-400" />
                <span className={`font-bold text-lg ${canAfford ? 'text-orange-400' : 'text-red-400'}`}>
                  {caseData.price}
                </span>
              </>
            )}
          </div>

          {/* Likes */}
          <div className="flex items-center space-x-1 text-slate-400">
            <Heart className="w-4 h-4" />
            <span className="text-sm">{caseData.likes_count || 0}</span>
          </div>
        </div>

        {/* Open button */}
        <button
          onClick={handleCaseClick}
          disabled={!isClickable}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 ${
            isClickable
              ? caseData.is_free
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-green-500/25'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-orange-500/25'
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          {disabled ? (
            <span className="flex items-center justify-center">
              <Lock className="w-4 h-4 mr-2" />
              Заблокировано
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Play className="w-4 h-4 mr-2" />
              Открыть кейс
            </span>
          )}
        </button>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default CaseCard;
