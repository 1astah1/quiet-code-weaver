
import { useState } from "react";
import { Heart, Eye, Play, Gift, Coins, Star } from "lucide-react";
import { Case } from "@/hooks/useCases";

interface CaseCardProps {
  caseItem: Case;
  isFavorite: boolean;
  canAfford: boolean;
  onOpen: (caseItem: Case) => void;
  onPreview: (caseItem: Case) => void;
  onToggleFavorite: (caseId: string) => void;
}

const CaseCard = ({ 
  caseItem, 
  isFavorite, 
  canAfford, 
  onOpen, 
  onPreview, 
  onToggleFavorite 
}: CaseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-3xl overflow-hidden border border-slate-700/30 hover:border-orange-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Premium Badge */}
      {!caseItem.is_free && (
        <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3" />
          PREMIUM
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button 
          onClick={() => onPreview(caseItem)}
          className="p-2.5 bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-xl transition-all duration-200 hover:scale-110 group/btn border border-white/10"
        >
          <Eye className="w-4 h-4 text-white group-hover/btn:text-orange-300" />
        </button>
        <button 
          onClick={() => onToggleFavorite(caseItem.id)}
          className={`p-2.5 backdrop-blur-sm rounded-xl transition-all duration-200 hover:scale-110 border border-white/10 ${
            isFavorite 
              ? 'bg-red-500/80 hover:bg-red-500/90' 
              : 'bg-black/40 hover:bg-black/60'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'text-white fill-current' : 'text-white'}`} />
        </button>
      </div>

      {/* Case Cover Image */}
      <div className="relative h-64 overflow-hidden">
        {caseItem.cover_image_url ? (
          <>
            <img 
              src={caseItem.cover_image_url} 
              alt={caseItem.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
          </>
        ) : (
          <div className="relative w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent transform -skew-x-12 transition-transform duration-1000 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`} />
            </div>
            
            {/* Case Icon */}
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl group-hover:shadow-orange-500/50 transition-all duration-500 group-hover:scale-110">
                <Gift className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Shimmer Effect */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 transition-transform duration-1000 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`} />
      </div>

      {/* Content Section */}
      <div className="relative p-6 space-y-4">
        {/* Case Title */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors duration-300">
            {caseItem.name}
          </h3>
          <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
            {caseItem.description}
          </p>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
          <div className="h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent flex-1" />
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
        </div>

        {/* Price and Action Section */}
        <div className="flex items-center justify-between gap-4">
          {/* Price Badge */}
          <div className={`px-4 py-2.5 rounded-2xl font-bold text-lg flex items-center gap-2 border-2 transition-all duration-300 ${
            caseItem.is_free 
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/40 shadow-lg shadow-green-500/20' 
              : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/40 shadow-lg shadow-yellow-500/20'
          }`}>
            {caseItem.is_free ? (
              <>
                <Gift className="w-5 h-5" />
                <span>БЕСПЛАТНО</span>
              </>
            ) : (
              <>
                <Coins className="w-5 h-5" />
                <span>{caseItem.price}</span>
              </>
            )}
          </div>
          
          {/* Open Button */}
          <button
            onClick={() => onOpen(caseItem)}
            className={`relative overflow-hidden flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 group/open ${
              caseItem.is_free || canAfford
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-orange-500/40 hover:from-orange-400 hover:to-red-400'
                : 'bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600'
            }`}
            disabled={!caseItem.is_free && !canAfford}
          >
            {/* Button Shine Effect */}
            {(caseItem.is_free || canAfford) && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 transition-transform duration-700 group-hover/open:translate-x-full" />
            )}
            
            <Play className="w-5 h-5 relative z-10" />
            <span className="relative z-10">
              {caseItem.is_free ? 'Открыть' : 'Открыть кейс'}
            </span>
          </button>
        </div>

        {/* Status Indicator for Disabled State */}
        {!caseItem.is_free && !canAfford && (
          <div className="text-center pt-2">
            <span className="text-slate-500 text-sm">
              Недостаточно монет
            </span>
          </div>
        )}
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

export default CaseCard;
