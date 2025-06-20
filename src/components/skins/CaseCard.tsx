
import { useState } from "react";
import { Heart, Eye, Play, Gift } from "lucide-react";
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
      className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Header */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-300 transition-colors">
              {caseItem.name}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {caseItem.description}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2 ml-4">
            <button 
              onClick={() => onPreview(caseItem)}
              className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-all duration-200 hover:scale-110 group/btn"
            >
              <Eye className="w-5 h-5 text-slate-300 group-hover/btn:text-white" />
            </button>
            <button 
              onClick={() => onToggleFavorite(caseItem.id)}
              className={`p-3 rounded-xl transition-all duration-200 hover:scale-110 ${
                isFavorite 
                  ? 'bg-red-500/20 hover:bg-red-500/30' 
                  : 'bg-slate-800/80 hover:bg-slate-700/80'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-400 fill-current' : 'text-slate-300'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Case Visual */}
      <div className="relative px-6 pb-6">
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl h-48 flex items-center justify-center overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-20">
            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-orange-500/20 to-transparent transform -skew-x-12 transition-transform duration-1000 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`} />
          </div>
          
          {/* Case Icon */}
          <div className="relative z-10 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-4 flex items-center justify-center mx-auto shadow-lg group-hover:shadow-orange-500/30 transition-shadow duration-300">
              <Gift className="w-12 h-12 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-slate-300 font-medium">{caseItem.name}</span>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between">
          {/* Price */}
          <div className={`px-4 py-2 rounded-full font-bold text-lg flex items-center gap-2 ${
            caseItem.is_free 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {caseItem.is_free ? (
              <>
                <Gift className="w-5 h-5" />
                БЕСПЛАТНО
              </>
            ) : (
              <>
                <span className="text-2xl">💰</span>
                {caseItem.price}
              </>
            )}
          </div>
          
          {/* Open Button */}
          <button
            onClick={() => onOpen(caseItem)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
              caseItem.is_free || canAfford
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-orange-500/25 hover:from-orange-400 hover:to-red-400'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
            disabled={!caseItem.is_free && !canAfford}
          >
            <Play className="w-5 h-5" />
            {caseItem.is_free ? 'Открыть' : 'Открыть кейс'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseCard;
