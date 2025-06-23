
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCaseOpeningLogger } from "@/hooks/useCaseOpeningLogger";

interface UseCaseOpeningProps {
  caseItem: any;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

export const useCaseOpening = ({ caseItem, currentUser, onCoinsUpdate }: UseCaseOpeningProps) => {
  const [wonSkin, setWonSkin] = useState<any>(null);
  const [wonCoins, setWonCoins] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'loading' | 'roulette' | 'complete'>('loading');
  const [isProcessing, setIsProcessing] = useState(false);
  const [caseSkins, setCaseSkins] = useState<any[]>([]);
  const { toast } = useToast();
  const { logCaseOpening } = useCaseOpeningLogger();

  const startTime = Date.now();

  // Загружаем содержимое кейса
  useEffect(() => {
    const loadCaseSkins = async () => {
      try {
        console.log('📦 [CASE_OPENING] Loading case contents for:', caseItem?.name);
        
        if (!caseItem?.id) {
          console.error('⚠️ [CASE_OPENING] No case ID provided');
          return;
        }
        
        const { data, error } = await supabase
          .from('case_skins')
          .select(`
            id,
            probability,
            never_drop,
            custom_probability,
            reward_type,
            skins (*),
            coin_rewards (*)
          `)
          .eq('case_id', caseItem.id)
          .eq('never_drop', false);

        if (error) {
          console.error('❌ [CASE_OPENING] Error loading case contents:', error);
          throw error;
        }
        
        console.log('✅ [CASE_OPENING] Case contents loaded:', data?.length || 0, 'items');
        setCaseSkins(data || []);
        
        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: caseItem.is_free || false,
          phase: 'opening'
        });

        // Переходим к рулетке после загрузки
        setTimeout(() => {
          setAnimationPhase('roulette');
        }, 1000);
        
      } catch (error) {
        console.error('💥 [CASE_OPENING] Error loading case contents:', error);
        toast({
          title: "Ошибка загрузки кейса",
          description: "Не удалось загрузить содержимое кейса",
          variant: "destructive"
        });
      }
    };

    if (caseItem?.id && currentUser?.id) {
      loadCaseSkins();
    }
  }, [caseItem?.id, currentUser.id]);

  const selectRandomReward = (availableRewards: any[]) => {
    console.log('🎲 [CASE_OPENING] Selecting random reward from:', availableRewards.length, 'options');
    
    if (availableRewards.length === 0) {
      console.error('❌ [CASE_OPENING] No available rewards');
      return null;
    }

    // Считаем общую вероятность
    const totalProbability = availableRewards.reduce((sum, item) => {
      const prob = item.custom_probability || item.probability || 0.01;
      return sum + prob;
    }, 0);

    console.log('📊 [CASE_OPENING] Total probability:', totalProbability);

    const random = Math.random() * totalProbability;
    let currentSum = 0;

    for (const item of availableRewards) {
      const prob = item.custom_probability || item.probability || 0.01;
      currentSum += prob;
      if (random <= currentSum) {
        console.log('🎯 [CASE_OPENING] Selected reward:', {
          type: item.reward_type,
          name: item.reward_type === 'coin_reward' ? item.coin_rewards?.name : item.skins?.name
        });
        return item;
      }
    }

    // Fallback на первый элемент
    console.log('⚠️ [CASE_OPENING] Fallback to first reward');
    return availableRewards[0];
  };

  const handleRouletteComplete = async (selectedReward: any) => {
    try {
      console.log('🎰 [CASE_OPENING] Roulette completed, processing reward:', selectedReward);

      if (!selectedReward) {
        throw new Error('Не удалось выбрать награду');
      }

      // Для бесплатных кейсов проверяем доступность
      if (caseItem.is_free) {
        // Проверяем когда последний раз открывали этот бесплатный кейс
        const { data: lastOpening } = await supabase
          .from('user_free_case_openings')
          .select('opened_at')
          .eq('user_id', currentUser.id)
          .eq('case_id', caseItem.id)
          .order('opened_at', { ascending: false })
          .limit(1)
          .single();

        if (lastOpening) {
          const timeDiff = Date.now() - new Date(lastOpening.opened_at).getTime();
          const twoHours = 2 * 60 * 60 * 1000;
          
          if (timeDiff < twoHours) {
            throw new Error('Бесплатный кейс можно открыть только раз в 2 часа');
          }
        }
      } else {
        // Для платных кейсов проверяем баланс и списываем деньги
        if (currentUser.coins < caseItem.price) {
          throw new Error('Недостаточно монет для открытия кейса');
        }

        const { error: coinsError } = await supabase.rpc('safe_update_coins', {
          p_user_id: currentUser.id,
          p_coin_change: -caseItem.price,
          p_operation_type: 'case_open'
        });

        if (coinsError) {
          throw new Error('Не удалось списать монеты: ' + coinsError.message);
        }

        onCoinsUpdate(currentUser.coins - caseItem.price);
      }

      // Обрабатываем награду
      if (selectedReward.reward_type === 'coin_reward' && selectedReward.coin_rewards) {
        console.log('🪙 [CASE_OPENING] Processing coin reward');
        
        const { error: addCoinsError } = await supabase.rpc('safe_update_coins', {
          p_user_id: currentUser.id,
          p_coin_change: selectedReward.coin_rewards.amount,
          p_operation_type: 'coin_reward'
        });

        if (addCoinsError) {
          throw new Error('Не удалось добавить монеты: ' + addCoinsError.message);
        }

        setWonCoins(selectedReward.coin_rewards.amount);
        
        if (!caseItem.is_free) {
          onCoinsUpdate(currentUser.coins - caseItem.price + selectedReward.coin_rewards.amount);
        } else {
          onCoinsUpdate(currentUser.coins + selectedReward.coin_rewards.amount);
        }

        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: caseItem.is_free || false,
          phase: 'complete',
          reward_type: 'coin_reward',
          reward_data: selectedReward.coin_rewards,
          duration_ms: Date.now() - startTime
        });

      } else if (selectedReward.skins) {
        console.log('🔫 [CASE_OPENING] Processing skin reward');
        
        const { error: inventoryError } = await supabase
          .from('user_inventory')
          .insert({
            user_id: currentUser.id,
            skin_id: selectedReward.skins.id
          });

        if (inventoryError) {
          throw new Error('Не удалось добавить скин в инвентарь: ' + inventoryError.message);
        }

        setWonSkin(selectedReward.skins);

        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: caseItem.is_free || false,
          phase: 'complete',
          reward_type: 'skin',
          reward_data: selectedReward.skins,
          duration_ms: Date.now() - startTime
        });
      }

      // Записываем в recent_wins
      await supabase
        .from('recent_wins')
        .insert({
          user_id: currentUser.id,
          case_id: caseItem.id,
          skin_id: selectedReward.skins?.id || null,
          reward_type: selectedReward.reward_type === 'coin_reward' ? 'coins' : 'skin',
          reward_data: selectedReward.reward_type === 'coin_reward' ? 
            { amount: selectedReward.coin_rewards.amount } : 
            selectedReward.skins,
          won_at: new Date().toISOString()
        });

      // Для бесплатных кейсов обновляем время последнего открытия
      if (caseItem.is_free) {
        await supabase
          .from('user_free_case_openings')
          .upsert({
            user_id: currentUser.id,
            case_id: caseItem.id,
            opened_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,case_id'
          });
      }

      setAnimationPhase('complete');
      setIsComplete(true);

    } catch (error: any) {
      console.error('❌ [CASE_OPENING] Error processing reward:', error);
      
      await logCaseOpening({
        user_id: currentUser.id,
        case_id: caseItem.id,
        case_name: caseItem.name,
        is_free: caseItem.is_free || false,
        phase: 'error',
        error_message: error.message,
        duration_ms: Date.now() - startTime
      });
      
      toast({
        title: "Ошибка открытия кейса",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addToInventory = async () => {
    console.log('📦 [CASE_OPENING] Item already in inventory');
    setIsProcessing(false);
  };

  const sellDirectly = async () => {
    if (!wonSkin) return;
    
    console.log('💰 [CASE_OPENING] Selling skin directly:', wonSkin.name);
    setIsProcessing(true);
    try {
      // Удаляем из инвентаря
      const { error: removeError } = await supabase
        .from('user_inventory')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('skin_id', wonSkin.id)
        .eq('is_sold', false);

      if (removeError) throw removeError;

      // Добавляем монеты
      const { error: coinsError } = await supabase.rpc('safe_update_coins', {
        p_user_id: currentUser.id,
        p_coin_change: wonSkin.price,
        p_operation_type: 'skin_sell'
      });

      if (coinsError) throw coinsError;
      
      onCoinsUpdate(currentUser.coins + wonSkin.price);
      toast({ title: `Скин продан за ${wonSkin.price} монет` });
    } catch (error: any) {
      console.error('❌ [CASE_OPENING] Error selling skin:', error);
      toast({
        title: "Ошибка продажи",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    wonSkin,
    wonCoins,
    isComplete,
    animationPhase,
    isProcessing,
    caseSkins,
    selectRandomReward,
    handleRouletteComplete,
    addToInventory,
    sellDirectly
  };
};
