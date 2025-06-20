
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Sparkles } from "lucide-react";

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
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'revealing' | 'complete'>('opening');
  const { toast } = useToast();

  const openCase = async () => {
    setIsOpening(true);
    setAnimationPhase('opening');

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

      // Анимация открытия
      setTimeout(() => {
        setAnimationPhase('revealing');
      }, 2000);

      // Показываем результат
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
          setAnimationPhase('complete');
          setIsComplete(true);

          toast({
            title: "Поздравляем!",
            description: `Вы выиграли ${selectedSkin.name}!`,
          });
        }
      }, 4000);
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
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            <Sparkles className="w-4 h-4 text-orange-400/30" />
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl p-8 w-full max-w-lg mx-4 text-center relative overflow-hidden border border-orange-500/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {animationPhase === 'opening' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-4">Открытие кейса...</h2>
            
            {/* Animated case */}
            <div className="relative">
              <div className="animate-bounce w-24 h-24 mx-auto mb-6">
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-4xl shadow-2xl shadow-orange-500/50">
                  📦
                </div>
              </div>
              
              {/* Rotating glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-transparent border-t-orange-500 border-r-orange-500 rounded-full animate-spin"></div>
              </div>
            </div>
            
            <p className="text-gray-300 text-lg">Определяем ваш выигрыш...</p>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}

        {animationPhase === 'revealing' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-4">Открываем...</h2>
            
            {/* Case opening animation */}
            <div className="relative">
              <div className="w-32 h-32 mx-auto">
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-5xl shadow-2xl shadow-orange-500/50 animate-ping">
                  ✨
                </div>
              </div>
              
              {/* Multiple rotating rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-2 border-transparent border-t-yellow-400 border-r-yellow-400 rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-transparent border-b-orange-400 border-l-orange-400 rounded-full animate-spin animation-delay-500" style={{animationDirection: 'reverse'}}></div>
              </div>
            </div>
            
            <p className="text-yellow-300 text-xl font-semibold animate-pulse">Почти готово!</p>
          </div>
        )}

        {isComplete && wonSkin && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-2">🎉 Поздравляем! 🎉</h2>
              <p className="text-yellow-400 text-lg font-semibold">Вы выиграли:</p>
            </div>
            
            <div className={`bg-gradient-to-br ${getRarityColor(wonSkin.rarity)} rounded-2xl p-6 transform animate-scale-in border-2 border-white/20`}>
              <div className="bg-black/30 rounded-xl h-40 mb-4 flex items-center justify-center relative overflow-hidden">
                {wonSkin.image_url ? (
                  <img 
                    src={wonSkin.image_url} 
                    alt={wonSkin.name}
                    className="max-w-full max-h-full object-contain animate-fade-in"
                  />
                ) : (
                  <span className="text-6xl animate-bounce">🎯</span>
                )}
                
                {/* Sparkle overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent animate-pulse"></div>
              </div>
              
              <h3 className="text-white font-bold text-2xl mb-2">{wonSkin.name}</h3>
              <p className="text-white/90 text-lg">{wonSkin.weapon_type}</p>
              <p className="text-white/70 text-sm uppercase tracking-wider">{wonSkin.rarity}</p>
            </div>
            
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105"
            >
              Забрать в инвентарь! 🎁
            </button>
            
            <p className="text-gray-400 text-sm">Предмет добавлен в ваш инвентарь</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseOpeningAnimation;
