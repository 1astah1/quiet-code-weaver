
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import type { CaseSkin } from "@/utils/supabaseTypes";

interface CasePreviewModalProps {
  caseItem: {
    id: string;
    name: string;
    description?: string;
    image_url?: string | null;
    cover_image_url?: string | null;
  };
  caseSkins?: any[];
  onClose: () => void;
}

const CasePreviewModal = ({ caseItem, onClose }: CasePreviewModalProps) => {
  const { data: caseSkins = [], isLoading } = useQuery({
    queryKey: ['case-skins-preview', caseItem.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('case_skins')
          .select(`
            probability,
            custom_probability,
            never_drop,
            skins!inner (
              id,
              name,
              weapon_type,
              rarity,
              price,
              image_url
            )
          `)
          .eq('case_id', caseItem.id)
          .eq('never_drop', false)
          .not('skins', 'is', null);
        
        if (error) {
          console.error('Error loading case skins:', error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error('Case skins query error:', error);
        return [];
      }
    },
    enabled: !!caseItem.id
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'consumer grade':
        return 'border-gray-400 bg-gray-900/50';
      case 'industrial grade':
        return 'border-blue-400 bg-blue-900/50';
      case 'mil-spec':
        return 'border-blue-500 bg-blue-800/50';
      case 'restricted':
        return 'border-purple-500 bg-purple-900/50';
      case 'classified':
        return 'border-pink-500 bg-pink-900/50';
      case 'covert':
        return 'border-red-500 bg-red-900/50';
      case 'contraband':
        return 'border-yellow-400 bg-yellow-900/50';
      default:
        return 'border-gray-400 bg-gray-900/50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">{caseItem.name}</h2>
            {caseItem.description && (
              <p className="text-gray-400 text-sm mt-1">{caseItem.description}</p>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-white">Загрузка содержимого...</span>
            </div>
          ) : caseSkins.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {caseSkins.map((caseSkin, index) => {
                const skin = caseSkin.skins;
                if (!skin) return null;
                
                const probability = caseSkin.custom_probability || caseSkin.probability || 0;
                const percentage = (probability * 100).toFixed(2);
                
                return (
                  <div
                    key={`${skin.id}-${index}`}
                    className={`rounded-lg p-3 border-2 ${getRarityColor(skin.rarity)} hover:scale-105 transition-transform`}
                  >
                    <div className="aspect-square mb-2 bg-gray-800 rounded-lg overflow-hidden">
                      {skin.image_url ? (
                        <OptimizedImage
                          src={skin.image_url}
                          alt={skin.name}
                          className="w-full h-full object-contain"
                          fallback={
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                              <span className="text-2xl">🔫</span>
                            </div>
                          }
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <span className="text-2xl">🔫</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-white text-xs font-medium mb-1 line-clamp-2">
                      {skin.name}
                    </h3>
                    
                    <p className="text-gray-400 text-xs mb-2">
                      {skin.weapon_type}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-orange-400 font-bold">
                        {skin.price} ₽
                      </span>
                      <span className="text-blue-400">
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                        {skin.rarity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Содержимое кейса недоступно
              </h3>
              <p className="text-gray-400">
                В этом кейсе пока нет предметов
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CasePreviewModal;
