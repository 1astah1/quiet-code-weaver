
import { X, Sparkles } from "lucide-react";
import { Case, CaseSkin } from "@/hooks/useCases";

interface CasePreviewModalProps {
  caseItem: Case;
  caseSkins: CaseSkin[];
  onClose: () => void;
}

const CasePreviewModal = ({ caseItem, caseSkins, onClose }: CasePreviewModalProps) => {
  const getRarityColor = (rarity: string) => {
    const colors = {
      'Covert': 'from-orange-500 to-red-500',
      'Classified': 'from-red-500 to-pink-500',
      'Restricted': 'from-purple-500 to-pink-500',
      'Mil-Spec': 'from-blue-500 to-purple-500',
      'Industrial': 'from-blue-400 to-blue-600',
      'Consumer': 'from-gray-500 to-gray-600',
    };
    return colors[rarity as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getRarityBorder = (rarity: string) => {
    const borders = {
      'Covert': 'border-orange-500/50',
      'Classified': 'border-red-500/50',
      'Restricted': 'border-purple-500/50',
      'Mil-Spec': 'border-blue-500/50',
      'Industrial': 'border-blue-400/50',
      'Consumer': 'border-gray-500/50',
    };
    return borders[rarity as keyof typeof borders] || 'border-gray-500/50';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{caseItem.name}</h3>
              <p className="text-slate-400">Содержимое кейса</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Description */}
        <div className="p-6 border-b border-slate-700/50">
          <p className="text-slate-300 leading-relaxed">{caseItem.description}</p>
        </div>
        
        {/* Skins List */}
        <div className="p-6">
          <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            Возможные предметы
          </h4>
          <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
            {caseSkins.map((item, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center bg-gradient-to-r ${getRarityColor(item.skins.rarity)}/10 border ${getRarityBorder(item.skins.rarity)} p-4 rounded-xl hover:bg-opacity-20 transition-all`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getRarityColor(item.skins.rarity)} shadow-lg`}></div>
                  <div>
                    <span className="text-white font-medium">{item.skins.name}</span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">{item.skins.weapon_type}</span>
                      <span className="text-slate-500">•</span>
                      <span className={`font-medium ${
                        item.skins.rarity === 'Covert' ? 'text-orange-400' :
                        item.skins.rarity === 'Classified' ? 'text-red-400' :
                        item.skins.rarity === 'Restricted' ? 'text-purple-400' :
                        'text-blue-400'
                      }`}>
                        {item.skins.rarity}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300 font-bold text-lg">{item.skins.price} 💰</div>
                  <div className="text-slate-400 text-sm font-medium">
                    {(item.probability * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50">
          <button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-xl p-4 text-white font-semibold transition-all hover:scale-[1.02]"
          >
            Закрыть превью
          </button>
        </div>
      </div>
    </div>
  );
};

export default CasePreviewModal;
