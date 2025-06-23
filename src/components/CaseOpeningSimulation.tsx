
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface CaseOpeningSimulationProps {
  caseItem: any;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const CaseOpeningSimulation = ({ caseItem, onClose, currentUser, onCoinsUpdate }: CaseOpeningSimulationProps) => {
  const [isOpening, setIsOpening] = useState(false);
  const [wonSkin, setWonSkin] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [allSkins, setAllSkins] = useState<any[]>([]);
  const [winningIndex, setWinningIndex] = useState<number>(0);
  const [showDecision, setShowDecision] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  const generateSkinsForAnimation = (caseRewards: any[], winnerSkin: any) => {
    const animationSkins = [];
    const totalSkins = 50;
    const winnerPosition = Math.floor(totalSkins * 0.8);
    
    for (let i = 0; i < totalSkins; i++) {
      if (i === winnerPosition) {
        animationSkins.push(winnerSkin);
      } else {
        const randomReward = caseRewards[Math.floor(Math.random() * caseRewards.length)];
        if (randomReward.reward_type === 'skin' && randomReward.skins) {
          animationSkins.push(randomReward.skins);
        } else if (randomReward.reward_type === 'coins' && randomReward.coin_rewards) {
          animationSkins.push({ ...randomReward.coin_rewards, isCoin: true });
        }
      }
    }
    
    return { skins: animationSkins, winnerIndex: winnerPosition };
  };

  const openCase = async () => {
    setIsOpening(true);

    try {
      // Get rewards from case using the new structure
      const { data: caseRewards, error: caseRewardsError } = await supabase
        .from('case_rewards')
        .select(`
          probability,
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
        .eq('is_active', true)
        .eq('never_drop', false);

      if (caseRewardsError) throw caseRewardsError;

      // Select random reward based on probability
      const random = Math.random();
      let cumulativeProbability = 0;
      let selectedReward = null;

      for (const reward of caseRewards || []) {
        cumulativeProbability += reward.probability;
        if (random <= cumulativeProbability) {
          selectedReward = reward;
          break;
        }
      }

      if (!selectedReward && caseRewards?.length) {
        selectedReward = caseRewards[0];
      }

      const selectedItem = selectedReward?.reward_type === 'skin' 
        ? selectedReward.skins 
        : selectedReward?.coin_rewards;

      // Generate animation skins
      const animationData = generateSkinsForAnimation(caseRewards || [], selectedItem);
      setAllSkins(animationData.skins);
      setWinningIndex(animationData.winnerIndex);

      // Start animation
      setTimeout(() => {
        if (scrollRef.current) {
          const skinWidth = 120;
          const finalPosition = animationData.winnerIndex * skinWidth - (window.innerWidth / 2) + (skinWidth / 2);
          
          scrollRef.current.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          scrollRef.current.style.transform = `translateX(-${finalPosition}px)`;
        }
      }, 100);

      // Complete animation after 4.5 seconds
      setTimeout(async () => {
        if (selectedItem) {
          // Deduct coins if case is not free
          if (!caseItem.is_free) {
            const newCoins = currentUser.coins - caseItem.price;
            const { error: coinsError } = await supabase
              .from('users')
              .update({ coins: newCoins })
              .eq('id', currentUser.id);

            if (coinsError) throw coinsError;
            onCoinsUpdate(newCoins);
          }

          setWonSkin(selectedItem);
          setIsOpening(false);
          setIsComplete(true);
          setShowDecision(true);
        }
      }, 4500);
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

  const handleKeepSkin = async () => {
    try {
      // Add skin to inventory
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert({
          user_id: currentUser.id,
          skin_id: wonSkin.id
        });

      if (inventoryError) throw inventoryError;

      // Add to recent wins
      await supabase
        .from('recent_wins')
        .insert({
          user_id: currentUser.id,
          skin_id: wonSkin.id,
          case_id: caseItem.id,
          reward_type: 'skin'
        });

      toast({
        title: "Скин добавлен в инвентарь!",
        description: `${wonSkin.name} теперь в вашем инвентаре`,
      });

      onClose();
    } catch (error) {
      console.error('Keep skin error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить скин в инвентарь",
        variant: "destructive",
      });
    }
  };

  const handleSellSkin = async () => {
    try {
      // Add coins for selling
      const newCoins = currentUser.coins + wonSkin.price;
      const { error: coinsError } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);

      if (coinsError) throw coinsError;

      // Add to recent wins
      await supabase
        .from('recent_wins')
        .insert({
          user_id: currentUser.id,
          skin_id: wonSkin.id,
          case_id: caseItem.id,
          reward_type: 'skin'
        });

      onCoinsUpdate(newCoins);

      toast({
        title: "Скин продан!",
        description: `Получено ${wonSkin.price} монет`,
      });

      onClose();
    } catch (error) {
      console.error('Sell skin error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось продать скин",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    openCase();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="w-full h-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <X className="w-8 h-8" />
        </button>

        {isOpening && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {/* Case opening header */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Открытие кейса</h2>
              <p className="text-xl text-gray-300">{caseItem.name}</p>
            </div>

            {/* CS2-style spinning animation container */}
            <div className="relative w-full max-w-4xl h-40 overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-lg border-2 border-orange-500">
              {/* Center indicator line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-red-500 z-10 transform -translate-x-1/2 shadow-lg"></div>
              
              {/* Top and bottom borders */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
              
              {/* Skins strip */}
              <div
                ref={scrollRef}
                className="flex items-center h-full transition-transform"
                style={{ transform: 'translateX(0px)' }}
              >
                {allSkins.map((skin, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-28 h-32 mx-1 bg-gradient-to-br ${getRarityColor(skin.rarity || 'Consumer')} rounded-lg p-3 flex flex-col items-center justify-center border-2 ${
                      index === winningIndex ? 'border-orange-500 shadow-lg shadow-orange-500/50' : 'border-transparent'
                    } relative overflow-hidden`}
                  >
                    {/* Rarity glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    <div className="bg-black/30 rounded w-full h-16 mb-2 flex items-center justify-center relative z-10">
                      <span className="text-2xl">{skin.isCoin ? '🪙' : '🎯'}</span>
                    </div>
                    <p className="text-white text-xs font-semibold text-center leading-tight relative z-10">
                      {skin.name && skin.name.length > 20 ? skin.name.substring(0, 20) + '...' : skin.name || 'Item'}
                    </p>
                    
                    {/* Rarity indicator */}
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-current opacity-80"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-150"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-300"></div>
              </div>
              <p className="text-gray-400">Определяем ваш выигрыш...</p>
            </div>
          </div>
        )}

        {isComplete && wonSkin && !showDecision && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="bg-gray-900/95 rounded-xl p-8 max-w-md w-full mx-4 text-center border border-orange-500/50">
              <h2 className="text-3xl font-bold text-white mb-6">Поздравляем!</h2>
              <div className={`bg-gradient-to-br ${getRarityColor(wonSkin.rarity || 'Consumer')} rounded-lg p-6 mb-6`}>
                <div className="bg-black/30 rounded-lg h-32 mb-4 flex items-center justify-center">
                  <span className="text-6xl">{wonSkin.isCoin ? '🪙' : '🎯'}</span>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">{wonSkin.name}</h3>
                <p className="text-white/80 mb-1">{wonSkin.weapon_type}</p>
                <p className="text-white/60 text-sm">{wonSkin.rarity}</p>
              </div>
              <button
                onClick={() => setShowDecision(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
              >
                Продолжить
              </button>
            </div>
          </div>
        )}

        {showDecision && wonSkin && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="bg-gray-900/95 rounded-xl p-8 max-w-md w-full mx-4 text-center border border-orange-500/50">
              <h2 className="text-2xl font-bold text-white mb-4">Что делать со скином?</h2>
              
              <div className={`bg-gradient-to-br ${getRarityColor(wonSkin.rarity || 'Consumer')} rounded-lg p-4 mb-6`}>
                <h3 className="text-white font-bold text-lg mb-1">{wonSkin.name}</h3>
                <p className="text-white/80 text-sm">{wonSkin.weapon_type}</p>
                <p className="text-yellow-400 font-bold mt-2">{wonSkin.price} монет</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleKeepSkin}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Забрать в инвентарь
                </button>
                
                <button
                  onClick={handleSellSkin}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Продать за {wonSkin.price} монет
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseOpeningSimulation;
