
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-600 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative">
          {caseItem.cover_image_url ? (
            <div className="h-48 bg-gradient-to-r from-slate-700 to-slate-600 relative overflow-hidden">
              <img
                src={caseItem.cover_image_url}
                alt={caseItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-r from-slate-700 to-slate-600" />
          )}
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-6 text-white">
            <h2 className="text-2xl font-bold mb-2">{caseItem.name}</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">₽</span>
                </div>
                <span className="text-orange-400 font-bold">{caseItem.price}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{caseItem.likes_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-600">
          <div className="flex space-x-1 p-6">
            <button
              onClick={() => setSelectedTab('contents')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'contents'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Содержимое ({droppableSkins.length})
            </button>
            <button
              onClick={() => setSelectedTab('info')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
        <div className="p-6 max-h-96 overflow-y-auto">
          {selectedTab === 'contents' ? (
            <div className="space-y-6">
              {/* Выпадающие скины */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Возможные выигрыши</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {droppableSkins.map((item, index) => (
                    <div
                      key={index}
                      className={`bg-slate-700/50 rounded-lg border ${getRarityColor(item.skins.rarity)} p-4`}
                    >
                      <div className="aspect-square bg-slate-800/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {item.skins.image_url ? (
                          <img
                            src={item.skins.image_url}
                            alt={item.skins.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-2xl">🔫</div>
                        )}
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1 truncate">
                        {item.skins.name}
                      </h4>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{item.skins.weapon_type}</span>
                        <span className="text-orange-400 font-bold">
                          {(item.custom_probability || item.probability * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Недоступные скины (never_drop) */}
              {neverDropSkins.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-400 mb-4">
                    Эксклюзивные предметы (не выпадают)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {neverDropSkins.map((item, index) => (
                      <div
                        key={index}
                        className={`bg-slate-700/30 rounded-lg border ${getRarityColor(item.skins.rarity)} p-4 opacity-60`}
                      >
                        <div className="aspect-square bg-slate-800/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {item.skins.image_url ? (
                            <img
                              src={item.skins.image_url}
                              alt={item.skins.name}
                              className="w-full h-full object-contain grayscale"
                            />
                          ) : (
                            <div className="text-2xl grayscale">🔫</div>
                          )}
                        </div>
                        <h4 className="text-slate-300 font-medium text-sm mb-1 truncate">
                          {item.skins.name}
                        </h4>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{item.skins.weapon_type}</span>
                          <span className="text-slate-500">Недоступен</span>
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
                <h3 className="text-lg font-semibold text-white mb-2">Описание</h3>
                <p className="text-slate-300">{caseItem.description || "Описание кейса отсутствует."}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Статистика</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-slate-400 text-sm">Предметов в кейсе</div>
                    <div className="text-white font-bold text-xl">{caseSkins.length}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-slate-400 text-sm">Лайки</div>
                    <div className="text-white font-bold text-xl">{caseItem.likes_count}</div>
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
