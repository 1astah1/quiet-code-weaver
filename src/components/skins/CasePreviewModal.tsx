
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/OptimizedImage";

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
  const { data: caseContents = [], isLoading } = useQuery({
    queryKey: ['case-contents', caseItem.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('case_skins')
          .select(`
            probability,
            custom_probability,
            never_drop,
            reward_type,
            skins (
              id,
              name,
              weapon_type,
              rarity,
              price,
              image_url
            ),
            coin_rewards (
              id,
              name,
              amount,
              image_url
            )
          `)
          .eq('case_id', caseItem.id)
          .eq('never_drop', false);
        
        if (error) {
          console.error('Error loading case contents:', error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Case contents query error:', error);
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
          ) : caseContents.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {caseContents.map((caseContent, index) => {
                const probability = caseContent.custom_probability || caseContent.probability || 0;
                const percentage = (probability * 100).toFixed(2);
                
                // Определяем тип награды и данные
                const isCoinsReward = caseContent.reward_type === 'coin_reward';
                const itemData = isCoinsReward ? caseContent.coin_rewards : caseContent.skins;
                
                if (!itemData) return null;
                
                return (
                  <div
                    key={`${itemData.id}-${index}`}
                    className={`rounded-lg p-3 border-2 ${
                      isCoinsReward 
                        ? 'border-yellow-400 bg-yellow-900/50' 
                        : getRarityColor(itemData.rarity || '')
                    } hover:scale-105 transition-transform`}
                  >
                    <div className="aspect-square mb-2 bg-gray-800 rounded-lg overflow-hidden">
                      {isCoinsReward ? (
                        <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-2xl">₽</span>
                        </div>
                      ) : itemData.image_url ? (
                        <OptimizedImage
                          src={itemData.image_url}
                          alt={itemData.name}
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
                      {itemData.name}
                    </h3>
                    
                    {!isCoinsReward && 'weapon_type' in itemData && (
                      <p className="text-gray-400 text-xs mb-2">
                        {itemData.weapon_type}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-orange-400 font-bold">
                        {isCoinsReward && 'amount' in itemData ? `${itemData.amount} монет` : 
                         !isCoinsReward && 'price' in itemData ? `${itemData.price} ₽` : 'N/A'}
                      </span>
                      <span className="text-blue-400">
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                        {isCoinsReward ? 'Монеты' : 
                         !isCoinsReward && 'rarity' in itemData ? itemData.rarity : 'Предмет'}
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
