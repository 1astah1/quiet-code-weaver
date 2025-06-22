
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'revealing' | 'bonus' | 'complete'>('opening');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBonusRoulette, setShowBonusRoulette] = useState(false);
  const [caseSkins, setCaseSkins] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadCaseSkins = async () => {
      try {
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

        if (error) throw error;
        setCaseSkins(data || []);
      } catch (error) {
        console.error('Error loading case skins:', error);
      }
    };

    if (caseItem?.id) {
      loadCaseSkins();
    }
  }, [caseItem?.id]);

  useEffect(() => {
    const startCaseOpening = async () => {
      try {
        // Phase 1: Opening animation
        setAnimationPhase('opening');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Phase 2: Revealing
        setAnimationPhase('revealing');

        if (caseItem?.is_free) {
          await handleFreeCaseOpening();
        } else {
          await handlePaidCaseOpening();
        }

      } catch (error: any) {
        console.error('Case opening error:', error);
        toast({
          title: "Ошибка открытия кейса",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    startCaseOpening();
  }, []);

  const selectRandomReward = (availableRewards: any[]) => {
    const totalProbability = availableRewards.reduce((sum, item) => {
      const prob = item.custom_probability || item.probability || 0;
      return sum + prob;
    }, 0);

    const random = Math.random() * totalProbability;
    let currentSum = 0;

    for (const item of availableRewards) {
      const prob = item.custom_probability || item.probability || 0;
      currentSum += prob;
      if (random <= currentSum) {
        return item;
      }
    }

    return availableRewards[0];
  };

  const handlePaidCaseOpening = async () => {
    try {
      if (currentUser.coins < caseItem.price) {
        throw new Error('Недостаточно монет');
      }

      const availableRewards = caseSkins.filter(item => !item.never_drop);
      if (availableRewards.length === 0) {
        throw new Error('В кейсе нет доступных наград');
      }

      const selectedReward = selectRandomReward(availableRewards);

      let result;
      if (selectedReward.reward_type === 'coin_reward') {
        // Open case with coin reward
        const { data, error } = await supabase.rpc('safe_open_case', {
          p_user_id: currentUser.id,
          p_case_id: caseItem.id,
          p_coin_reward_id: selectedReward.coin_rewards.id,
          p_is_free: false
        });

        if (error) throw error;
        result = data;
        
        setWonCoins(selectedReward.coin_rewards.amount);
        onCoinsUpdate(currentUser.coins - caseItem.price + selectedReward.coin_rewards.amount);
      } else {
        // Open case with skin
        const { data, error } = await supabase.rpc('safe_open_case', {
          p_user_id: currentUser.id,
          p_case_id: caseItem.id,
          p_skin_id: selectedReward.skins.id,
          p_is_free: false
        });

        if (error) throw error;
        result = data;
        
        setWonSkin(selectedReward.skins);
        onCoinsUpdate(currentUser.coins - caseItem.price);
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (selectedReward.reward_type === 'coin_reward') {
        // Check for bonus multiplier for coin rewards
        if (Math.random() < 0.15) { // 15% chance for bonus
          setShowBonusRoulette(true);
          setAnimationPhase('bonus');
        } else {
          setIsComplete(true);
          setAnimationPhase('complete');
        }
      } else {
        setIsComplete(true);
        setAnimationPhase('complete');
      }

    } catch (error: any) {
      throw error;
    }
  };

  const handleFreeCaseOpening = async () => {
    try {
      const availableRewards = caseSkins.filter(item => !item.never_drop);
      if (availableRewards.length === 0) {
        throw new Error('В бесплатном кейсе нет доступных наград');
      }

      const selectedReward = selectRandomReward(availableRewards);

      if (selectedReward.reward_type === 'coin_reward') {
        const { error } = await supabase.rpc('safe_open_case', {
          p_user_id: currentUser.id,
          p_case_id: caseItem.id,
          p_coin_reward_id: selectedReward.coin_rewards.id,
          p_is_free: true
        });

        if (error) throw error;
        
        setWonCoins(selectedReward.coin_rewards.amount);
        onCoinsUpdate(currentUser.coins + selectedReward.coin_rewards.amount);
      } else {
        const { error } = await supabase.rpc('safe_open_case', {
          p_user_id: currentUser.id,
          p_case_id: caseItem.id,
          p_skin_id: selectedReward.skins.id,
          p_is_free: true
        });

        if (error) throw error;
        
        setWonSkin(selectedReward.skins);
      }

      // Update last free case time
      await supabase
        .from('users')
        .update({ last_free_case_notification: new Date().toISOString() })
        .eq('id', currentUser.id);

      await new Promise(resolve => setTimeout(resolve, 3000));
      setIsComplete(true);
      setAnimationPhase('complete');

    } catch (error: any) {
      throw error;
    }
  };

  const handleFreeCaseResult = (reward: any) => {
    if (reward.reward_type === 'coin_reward') {
      setWonCoins(reward.amount);
    } else {
      setWonSkin(reward);
    }
    setIsComplete(true);
    setAnimationPhase('complete');
  };

  const addToInventory = async () => {
    // Already added during case opening
    setIsProcessing(false);
  };

  const sellDirectly = async () => {
    if (!wonSkin) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('safe_update_coins', {
        p_user_id: currentUser.id,
        p_coin_change: wonSkin.price,
        p_operation_type: 'skin_sell'
      });

      if (error) throw error;
      
      onCoinsUpdate(currentUser.coins + wonSkin.price);
      toast({ title: `Скин продан за ${wonSkin.price} монет` });
    } catch (error: any) {
      toast({
        title: "Ошибка продажи",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBonusComplete = (multiplier: number, finalCoins: number) => {
    setWonCoins(finalCoins);
    onCoinsUpdate(currentUser.coins - caseItem.price + finalCoins);
    setIsComplete(true);
    setAnimationPhase('complete');
  };

  const handleBonusSkip = () => {
    setIsComplete(true);
    setAnimationPhase('complete');
  };

  return {
    wonSkin,
    wonCoins,
    isComplete,
    animationPhase,
    isProcessing,
    showBonusRoulette,
    addToInventory,
    sellDirectly,
    caseSkins,
    handleBonusComplete,
    handleBonusSkip,
    handleFreeCaseResult
  };
};
