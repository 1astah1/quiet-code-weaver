
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CaseRoulette from "@/components/animations/CaseRoulette";
import { useCaseOpeningLogger } from "@/hooks/useCaseOpeningLogger";

interface CaseOpeningAnimationProps {
  caseItem: {
    id: string;
    name: string;
    price: number;
    is_free: boolean;
  };
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const CaseOpeningAnimation = ({ caseItem, onClose, currentUser, onCoinsUpdate }: CaseOpeningAnimationProps) => {
  const [selectedWinner, setSelectedWinner] = useState<any>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [openingPhase, setOpeningPhase] = useState<'preparing' | 'opening' | 'revealing' | 'complete'>('preparing');
  const { toast } = useToast();
  const { logCaseOpening } = useCaseOpeningLogger();
  const startTime = Date.now();

  // Enhanced case skins query with proper error handling
  const { data: caseSkins = [], isLoading, error } = useQuery({
    queryKey: ['case-skins-opening', caseItem.id],
    queryFn: async () => {
      try {
        console.log('🎰 Loading case contents for opening:', caseItem.name);
        
        const { data, error } = await supabase
          .from('case_skins')
          .select(`
            probability,
            never_drop,
            custom_probability,
            reward_type,
            skins!case_skins_skin_id_fkey (
              id,
              name,
              weapon_type,
              rarity,
              price,
              image_url
            ),
            coin_rewards!case_skins_coin_reward_id_fkey (
              id,
              name,
              amount,
              image_url
            )
          `)
          .eq('case_id', caseItem.id)
          .eq('never_drop', false);
        
        if (error) {
          console.error('❌ Error loading case contents:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          throw new Error('Кейс пуст или недоступен');
        }
        
        console.log('✅ Case contents loaded:', data.length, 'items');
        return data;
      } catch (error) {
        console.error('❌ Case opening preparation failed:', error);
        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: caseItem.is_free,
          phase: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          duration_ms: Date.now() - startTime
        });
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000
  });

  // Enhanced probability-based reward selection
  const selectRandomReward = (rewards: any[]) => {
    try {
      console.log('🎲 Selecting random reward from', rewards.length, 'options');
      
      if (rewards.length === 0) {
        throw new Error('No rewards available');
      }
      
      // Calculate total probability weight
      const totalWeight = rewards.reduce((sum, item) => {
        const probability = item.custom_probability || item.probability || 0.01;
        return sum + probability;
      }, 0);
      
      if (totalWeight === 0) {
        console.warn('⚠️ Total weight is 0, using equal distribution');
        const randomIndex = Math.floor(Math.random() * rewards.length);
        return rewards[randomIndex];
      }
      
      // Generate random number and select item
      const random = Math.random() * totalWeight;
      let currentWeight = 0;
      
      for (const item of rewards) {
        const probability = item.custom_probability || item.probability || 0.01;
        currentWeight += probability;
        
        if (random <= currentWeight) {
          console.log('🎯 Selected reward:', item);
          return item;
        }
      }
      
      // Fallback to last item
      console.warn('⚠️ Fallback to last item');
      return rewards[rewards.length - 1];
    } catch (error) {
      console.error('❌ Error selecting reward:', error);
      // Return first item as fallback
      return rewards[0] || null;
    }
  };

  // Secure case opening with enhanced error handling and logging
  const openCase = async (selectedReward: any) => {
    try {
      console.log('🔐 Starting secure case opening...');
      setOpeningPhase('opening');
      
      await logCaseOpening({
        user_id: currentUser.id,
        case_id: caseItem.id,
        case_name: caseItem.name,
        is_free: caseItem.is_free,
        phase: 'opening'
      });

      // Determine reward parameters
      const isSkipReward = selectedReward.reward_type === 'skin';
      const skinId = isSkipReward ? selectedReward.skins?.id : null;
      const coinRewardId = !isSkipReward ? selectedReward.coin_rewards?.id : null;

      // Call secure case opening function
      const { data: result, error } = await supabase.rpc('safe_open_case', {
        p_user_id: currentUser.id,
        p_case_id: caseItem.id,
        p_skin_id: skinId,
        p_coin_reward_id: coinRewardId,
        p_is_free: caseItem.is_free
      });

      if (error) {
        console.error('❌ Case opening failed:', error);
        throw new Error(error.message || 'Ошибка при открытии кейса');
      }

      if (!result || !result.success) {
        throw new Error('Неверный ответ сервера');
      }

      console.log('✅ Case opened successfully:', result);
      
      setOpeningPhase('revealing');
      
      await logCaseOpening({
        user_id: currentUser.id,
        case_id: caseItem.id,
        case_name: caseItem.name,
        is_free: caseItem.is_free,
        phase: 'revealing',
        reward_type: result.reward.type,
        reward_data: result.reward
      });

      // Update user coins based on reward type
      if (result.reward.type === 'coin_reward') {
        onCoinsUpdate(currentUser.coins + result.reward.amount);
      } else {
        // For skin rewards, coins were already deducted by the function
        if (!caseItem.is_free) {
          onCoinsUpdate(currentUser.coins - caseItem.price);
        }
      }

      setSelectedWinner(result.reward);
      setOpeningPhase('complete');
      
      await logCaseOpening({
        user_id: currentUser.id,
        case_id: caseItem.id,
        case_name: caseItem.name,
        is_free: caseItem.is_free,
        phase: 'complete',
        reward_type: result.reward.type,
        reward_data: result.reward,
        duration_ms: Date.now() - startTime
      });

      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('🚨 Case opening error:', error);
      
      await logCaseOpening({
        user_id: currentUser.id,
        case_id: caseItem.id,
        case_name: caseItem.name,
        is_free: caseItem.is_free,
        phase: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime
      });

      toast({
        title: "Ошибка открытия кейса",
        description: error instanceof Error ? error.message : "Произошла неизвестная ошибка",
        variant: "destructive",
      });
      
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleRouletteComplete = (selectedReward: any) => {
    console.log('🎰 Roulette completed, opening case with:', selectedReward);
    openCase(selectedReward);
  };

  useEffect(() => {
    if (caseSkins.length > 0 && !isOpening && openingPhase === 'preparing') {
      console.log('🚀 Starting case opening animation');
      setIsOpening(true);
      setOpeningPhase('opening');
    }
  }, [caseSkins, isOpening, openingPhase]);

  if (error) {
    console.error('❌ Case opening error:', error);
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ Ошибка загрузки кейса</div>
          <div className="text-white mb-4">{error.message || 'Неизвестная ошибка'}</div>
          <button 
            onClick={onClose}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || caseSkins.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-white text-xl mb-4">🎰 Подготовка кейса...</div>
          <div className="text-gray-400">Загружаем содержимое кейса</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Открываем кейс: {caseItem.name}
        </h2>
        <div className="text-orange-400 text-lg">
          {openingPhase === 'preparing' && '⏳ Подготовка...'}
          {openingPhase === 'opening' && '🎰 Крутим рулетку...'}
          {openingPhase === 'revealing' && '🎉 Показываем результат!'}
          {openingPhase === 'complete' && '✅ Готово!'}
        </div>
      </div>

      <CaseRoulette
        caseSkins={caseSkins}
        onComplete={handleRouletteComplete}
        selectRandomReward={selectRandomReward}
      />

      {selectedWinner && (
        <div className="mt-8 text-center">
          <div className="text-2xl font-bold text-green-400 mb-4">🎉 Поздравляем!</div>
          <div className="text-white text-xl">
            {selectedWinner.type === 'coin_reward' 
              ? `Вы получили ${selectedWinner.amount} монет!`
              : `Вы выиграли: ${selectedWinner.name}!`
            }
          </div>
        </div>
      )}

      {/* Emergency close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl"
        aria-label="Закрыть"
      >
        ✕
      </button>
    </div>
  );
};

export default CaseOpeningAnimation;
