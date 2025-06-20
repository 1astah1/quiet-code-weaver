import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Sparkles, Coins, ShoppingBag } from "lucide-react";

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
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'spinning' | 'slowing' | 'revealing' | 'complete'>('opening');
  const [spinItems, setSpinItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
          custom_probability,
          never_drop,
          skins (*)
        `)
        .eq('case_id', caseItem.id)
        .eq('never_drop', false);

      if (caseSkinsError) throw caseSkinsError;

      if (!caseSkins || caseSkins.length === 0) {
        throw new Error('В кейсе нет доступных предметов');
      }

      // Создаем массив элементов для анимации
      const itemsForSpin = [];
      for (let i = 0; i < 50; i++) {
        const randomSkin = caseSkins[Math.floor(Math.random() * caseSkins.length)];
        itemsForSpin.push({
          ...randomSkin.skins,
          isWinner: false
        });
      }

      // Выбираем случайный скин на основе вероятности
      const random = Math.random();
      let cumulativeProbability = 0;
      let selectedSkin = null;

      for (const item of caseSkins) {
        const probability = item.custom_probability || item.probability;
        cumulativeProbability += probability;
        if (random <= cumulativeProbability) {
          selectedSkin = item.skins;
          break;
        }
      }

      if (!selectedSkin && caseSkins.length) {
        selectedSkin = caseSkins[0].skins;
      }

      // Помещаем выигрышный предмет в середину
      itemsForSpin[25] = { ...selectedSkin, isWinner: true };
      setSpinItems(itemsForSpin);

      // Фазы анимации
      setTimeout(() => setAnimationPhase('spinning'), 1000);
      setTimeout(() => setAnimationPhase('slowing'), 3000);
      setTimeout(() => setAnimationPhase('revealing'), 5000);
      
      // Показываем результат
      setTimeout(async () => {
        if (selectedSkin) {
          setWonSkin(selectedSkin);
          setAnimationPhase('complete');
          setIsComplete(true);
          setIsOpening(false);

          toast({
            title: "🎉 Поздравляем!",
            description: `Вы выиграли ${selectedSkin.name}!`,
          });
        }
      }, 6000);
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

  const addToInventory = async () => {
    if (!wonSkin || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Добавляем скин в инвентарь
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert({
          user_id: currentUser.id,
          skin_id: wonSkin.id
        });

      if (inventoryError) throw inventoryError;

      // Добавляем в недавние выигрыши
      const { error: recentWinError } = await supabase
        .from('recent_wins')
        .insert({
          user_id: currentUser.id,
          skin_id: wonSkin.id,
          case_id: caseItem.id
        });

      if (recentWinError) console.error('Recent win error:', recentWinError);

      // Списываем монеты, если кейс не бесплатный
      if (!caseItem.is_free) {
        const newCoins = currentUser.coins - caseItem.price;
        const { error: coinsError } = await supabase
          .from('users')
          .update({ coins: newCoins })
          .eq('id', currentUser.id);

        if (coinsError) throw coinsError;
        onCoinsUpdate(newCoins);
      }

      toast({
        title: "Скин добавлен в инвентарь!",
        description: `${wonSkin.name} теперь в ваших выигрышах`,
      });

      onClose();
    } catch (error) {
      console.error('Add to inventory error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить скин в инвентарь",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sellDirectly = async () => {
    if (!wonSkin || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Сразу продаем скин за его цену
      const sellPrice = wonSkin.price;
      let newCoins = currentUser.coins + sellPrice;
      
      // Списываем цену кейса, если он не бесплатный
      if (!caseItem.is_free) {
        newCoins -= caseItem.price;
      }

      const { error: coinsError } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);

      if (coinsError) throw coinsError;

      // Добавляем в недавние выигрыши (как проданный)
      const { error: recentWinError } = await supabase
        .from('recent_wins')
        .insert({
          user_id: currentUser.id,
          skin_id: wonSkin.id,
          case_id: caseItem.id
        });

      if (recentWinError) console.error('Recent win error:', recentWinError);

      onCoinsUpdate(newCoins);

      toast({
        title: "Скин продан!",
        description: `Получено ${sellPrice} монет за ${wonSkin.name}`,
      });

      onClose();
    } catch (error) {
      console.error('Sell directly error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось продать скин",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`
            }}
          >
            <Sparkles className="w-4 h-4 text-orange-400/40" />
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-3xl p-8 w-full max-w-4xl mx-4 text-center relative overflow-hidden border border-orange-500/30">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-8 h-8" />
        </button>

        {(animationPhase === 'opening' || animationPhase === 'spinning' || animationPhase === 'slowing') && (
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white mb-6">
              {animationPhase === 'opening' && "Открытие кейса..."}
              {animationPhase === 'spinning' && "Определяем выигрыш..."}
              {animationPhase === 'slowing' && "Почти готово!"}
            </h2>
            
            {animationPhase === 'opening' && (
              <div className="relative">
                <div className="animate-bounce w-32 h-32 mx-auto mb-8">
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-6xl shadow-2xl shadow-orange-500/50">
                    📦
                  </div>
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 border-4 border-transparent border-t-orange-500 border-r-orange-500 rounded-full animate-spin"></div>
                </div>
              </div>
            )}

            {(animationPhase === 'spinning' || animationPhase === 'slowing') && (
              <div className="relative h-40 overflow-hidden bg-gradient-to-r from-transparent via-black/50 to-transparent rounded-xl border border-orange-500/30">
                <div 
                  className={`flex absolute top-0 transition-transform duration-1000 ${
                    animationPhase === 'spinning' ? 'animate-[spin-items_2s_linear_infinite]' : 
                    animationPhase === 'slowing' ? 'animate-[spin-slow_3s_ease-out_forwards]' : ''
                  }`}
                  style={{
                    transform: animationPhase === 'slowing' ? 'translateX(-50%)' : 'translateX(0)',
                    width: `${spinItems.length * 160}px`
                  }}
                >
                  {spinItems.map((item, index) => (
                    <div
                      key={index}
                      className={`w-32 h-32 mx-4 my-4 bg-gradient-to-br ${getRarityColor(item.rarity)} rounded-xl flex flex-col items-center justify-center p-2 border-2 ${
                        index === 25 ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-white/20'
                      }`}
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-16 h-16 object-contain" />
                      ) : (
                        <div className="w-16 h-16 bg-white/20 rounded"></div>
                      )}
                      <span className="text-white text-xs font-bold text-center truncate w-full">
                        {item.name?.split('|')[0]}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Центральный указатель */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/50"></div>
              </div>
            )}
          </div>
        )}

        {animationPhase === 'revealing' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white mb-6">Открываем...</h2>
            
            <div className="relative">
              <div className="w-40 h-40 mx-auto">
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-6xl shadow-2xl shadow-orange-500/50 animate-ping">
                  ✨
                </div>
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-4 border-transparent border-t-yellow-400 border-r-yellow-400 rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-56 border-4 border-transparent border-b-orange-400 border-l-orange-400 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
              </div>
            </div>
            
            <p className="text-yellow-300 text-2xl font-semibold animate-pulse">Почти готово!</p>
          </div>
        )}

        {isComplete && wonSkin && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-5xl font-bold text-white mb-4">🎉 Поздравляем! 🎉</h2>
              <p className="text-yellow-400 text-2xl font-semibold">Вы выиграли:</p>
            </div>
            
            <div className={`bg-gradient-to-br ${getRarityColor(wonSkin.rarity)} rounded-3xl p-8 transform animate-scale-in border-4 border-white/30 relative overflow-hidden`}>
              <div className="bg-black/30 rounded-2xl h-48 mb-6 flex items-center justify-center relative overflow-hidden">
                {wonSkin.image_url ? (
                  <img 
                    src={wonSkin.image_url} 
                    alt={wonSkin.name}
                    className="max-w-full max-h-full object-contain animate-fade-in"
                  />
                ) : (
                  <span className="text-8xl animate-bounce">🎯</span>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-pulse"></div>
              </div>
              
              <h3 className="text-white font-bold text-3xl mb-3">{wonSkin.name}</h3>
              <p className="text-white/90 text-xl mb-2">{wonSkin.weapon_type}</p>
              <p className="text-white/70 text-lg uppercase tracking-wider mb-4">{wonSkin.rarity}</p>
              
              <div className="flex items-center justify-center space-x-2 mb-6">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-2xl">{wonSkin.price} монет</span>
              </div>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <button
                onClick={addToInventory}
                disabled={isProcessing}
                className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isProcessing ? "Добавляем..." : "Забрать в инвентарь"}</span>
              </button>
              
              <button
                onClick={sellDirectly}
                disabled={isProcessing}
                className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <Coins className="w-5 h-5" />
                <span>{isProcessing ? "Продаем..." : `Продать за ${wonSkin.price}`}</span>
              </button>
            </div>
            
            <p className="text-gray-400 text-sm">Выберите действие с выигранным предметом</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin-items {
          0% { transform: translateX(0); }
          100% { transform: translateX(-160px); }
        }
        
        @keyframes spin-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-4000px); }
        }
      `}</style>
    </div>
  );
};

export default CaseOpeningAnimation;
