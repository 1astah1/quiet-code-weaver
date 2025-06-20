
import { useState } from "react";
import { X, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CasePreviewModalProps {
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
  caseSkins: Array<{
    probability: number;
    never_drop?: boolean;
    custom_probability?: number;
    skins: {
      id: string;
      name: string;
      weapon_type: string;
      rarity: string;
      price: number;
      image_url: string | null;
    };
  }>;
  onClose: () => void;
}

const rarityColors = {
  'Consumer Grade': 'border-gray-400 bg-gray-400/20',
  'Industrial Grade': 'border-blue-400 bg-blue-400/20',
  'Mil-Spec': 'border-purple-400 bg-purple-400/20',
  'Restricted': 'border-pink-400 bg-pink-400/20',
  'Classified': 'border-red-400 bg-red-400/20',
  'Covert': 'border-orange-400 bg-orange-400/20',
  'Contraband': 'border-yellow-400 bg-yellow-400/20'
};

const getRarityColor = (rarity: string) => {
  return rarityColors[rarity as keyof typeof rarityColors] || 'border-gray-400 bg-gray-400/20';
};

const CasePreviewModal = ({ caseItem, caseSkins, onClose }: CasePreviewModalProps) => {
  const [selectedTab, setSelectedTab] = useState<'contents' | 'info'>('contents');

  // Фильтруем скины которые могут выпасть (не never_drop)
  const droppableSkins = caseSkins.filter(skin => !skin.never_drop);
  const neverDropSkins = caseSkins.filter(skin => skin.never_drop);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-600 w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="relative">
          {caseItem.cover_image_url ? (
            <div className="h-32 sm:h-48 bg-gradient-to-r from-slate-700 to-slate-600 relative overflow-hidden">
              <img
                src={caseItem.cover_image_url}
                alt={caseItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          ) : (
            <div className="h-32 sm:h-48 bg-gradient-to-r from-slate-700 to-slate-600" />
          )}
          
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="absolute bottom-2 left-3 sm:bottom-4 sm:left-6 text-white">
            <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">{caseItem.name}</h2>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">₽</span>
                </div>
                <span className="text-orange-400 font-bold text-sm sm:text-base">{caseItem.price}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                <span className="text-sm sm:text-base">{caseItem.likes_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-600">
          <div className="flex space-x-1 p-3 sm:p-6">
            <button
              onClick={() => setSelectedTab('contents')}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                selectedTab === 'contents'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Package className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              Содержимое ({droppableSkins.length})
            </button>
            <button
              onClick={() => setSelectedTab('info')}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                selectedTab === 'info'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Информация
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 max-h-96 overflow-y-auto">
          {selectedTab === 'contents' ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Выпадающие скины */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Возможные выигрыши</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                  {droppableSkins.map((item, index) => (
                    <div
                      key={index}
                      className={`bg-slate-700/50 rounded-lg border ${getRarityColor(item.skins.rarity)} p-2 sm:p-4`}
                    >
                      <div className="aspect-square bg-slate-800/50 rounded-lg mb-2 sm:mb-3 flex items-center justify-center overflow-hidden">
                        {item.skins.image_url ? (
                          <img
                            src={item.skins.image_url}
                            alt={item.skins.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-lg sm:text-2xl">🔫</div>
                        )}
                      </div>
                      <h4 className="text-white font-medium text-xs sm:text-sm mb-1 truncate">
                        {item.skins.name}
                      </h4>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 truncate">{item.skins.weapon_type}</span>
                        <span className="text-orange-400 font-bold ml-1">
                          {(item.custom_probability || item.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Недоступные скины (never_drop) */}
              {neverDropSkins.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-400 mb-3 sm:mb-4">
                    Эксклюзивные предметы (не выпадают)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                    {neverDropSkins.map((item, index) => (
                      <div
                        key={index}
                        className={`bg-slate-700/30 rounded-lg border ${getRarityColor(item.skins.rarity)} p-2 sm:p-4 opacity-60`}
                      >
                        <div className="aspect-square bg-slate-800/50 rounded-lg mb-2 sm:mb-3 flex items-center justify-center overflow-hidden">
                          {item.skins.image_url ? (
                            <img
                              src={item.skins.image_url}
                              alt={item.skins.name}
                              className="w-full h-full object-contain grayscale"
                            />
                          ) : (
                            <div className="text-lg sm:text-2xl grayscale">🔫</div>
                          )}
                        </div>
                        <h4 className="text-slate-300 font-medium text-xs sm:text-sm mb-1 truncate">
                          {item.skins.name}
                        </h4>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 truncate">{item.skins.weapon_type}</span>
                          <span className="text-slate-500 ml-1">Недоступен</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Описание</h3>
                <p className="text-slate-300 text-sm sm:text-base">{caseItem.description || "Описание кейса отсутствует."}</p>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Статистика</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-slate-400 text-xs sm:text-sm">Предметов в кейсе</div>
                    <div className="text-white font-bold text-lg sm:text-xl">{caseSkins.length}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-slate-400 text-xs sm:text-sm">Лайки</div>
                    <div className="text-white font-bold text-lg sm:text-xl">{caseItem.likes_count}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CasePreviewModal;
