
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface CaseOpeningAnimationProps {
  caseItem: any;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const CaseOpeningAnimation = ({ caseItem, onClose, currentUser, onCoinsUpdate }: CaseOpeningAnimationProps) => {
  const [isOpening, setIsOpening] = useState(false);
  const [wonSkin, setWonSkin] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const openCase = async () => {
    setIsOpening(true);

    try {
      // Получаем скины из кейса
      const { data: caseSkins, error: caseSkinsError } = await supabase
        .from('case_skins')
        .select(`
          probability,
          skins (*)
        `)
        .eq('case_id', caseItem.id);

      if (caseSkinsError) throw caseSkinsError;

      // Выбираем случайный скин на основе вероятности
      const random = Math.random();
      let cumulativeProbability = 0;
      let selectedSkin = null;

      for (const item of caseSkins || []) {
        cumulativeProbability += item.probability;
        if (random <= cumulativeProbability) {
          selectedSkin = item.skins;
          break;
        }
      }

      if (!selectedSkin && caseSkins?.length) {
        selectedSkin = caseSkins[0].skins;
      }

      // Симулируем анимацию открытия
      setTimeout(async () => {
        if (selectedSkin) {
          // Добавляем скин в инвентарь
          const { error: inventoryError } = await supabase
            .from('user_inventory')
            .insert({
              user_id: currentUser.id,
              skin_id: selectedSkin.id
            });

          if (inventoryError) {
            console.error('Inventory error:', inventoryError);
          }

          // Добавляем в недавние выигрыши
          const { error: recentWinError } = await supabase
            .from('recent_wins')
            .insert({
              user_id: currentUser.id,
              skin_id: selectedSkin.id,
              case_id: caseItem.id
            });

          if (recentWinError) {
            console.error('Recent win error:', recentWinError);
          }

          // Списываем монеты, если кейс не бесплатный
          if (!caseItem.is_free) {
            const newCoins = currentUser.coins - caseItem.price;
            const { error: coinsError } = await supabase
              .from('users')
              .update({ coins: newCoins })
              .eq('id', currentUser.id);

            if (coinsError) {
              console.error('Coins update error:', coinsError);
            } else {
              onCoinsUpdate(newCoins);
            }
          }

          setWonSkin(selectedSkin);
          setIsOpening(false);
          setIsComplete(true);

          toast({
            title: "Поздравляем!",
            description: `Вы выиграли ${selectedSkin.name}!`,
          });
        }
      }, 3000);
    } catch (error) {
      console.error('Case opening error:', error);
      setIsOpening(false);
      toast({
        title: "Ошибка",
        description: "Не удалось открыть кейс",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    openCase();
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Consumer': return 'from-gray-600 to-gray-700';
      case 'Industrial': return 'from-blue-600 to-blue-700';
      case 'Mil-Spec': return 'from-purple-600 to-purple-700';
      case 'Restricted': return 'from-pink-600 to-pink-700';
      case 'Classified': return 'from-red-600 to-red-700';
      case 'Covert': return 'from-orange-600 to-orange-700';
      case 'Contraband': return 'from-yellow-600 to-yellow-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl p-8 w-full max-w-md mx-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {isOpening && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Открытие кейса...</h2>
            <div className="animate-spin w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400">Определяем ваш выигрыш...</p>
          </div>
        )}

        {isComplete && wonSkin && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Поздравляем!</h2>
            <div className={`bg-gradient-to-br ${getRarityColor(wonSkin.rarity)} rounded-lg p-6`}>
              <div className="bg-black/30 rounded-lg h-32 mb-4 flex items-center justify-center">
                <span className="text-4xl">🎯</span>
              </div>
              <h3 className="text-white font-bold text-lg">{wonSkin.name}</h3>
              <p className="text-white/80">{wonSkin.weapon_type}</p>
              <p className="text-white/60 text-sm">{wonSkin.rarity}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold"
            >
              Продолжить
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseOpeningAnimation;
