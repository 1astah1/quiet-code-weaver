
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
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'revealing' | 'bonus' | 'complete'>('opening');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBonusRoulette, setShowBonusRoulette] = useState(false);
  const [caseSkins, setCaseSkins] = useState<any[]>([]);
  const { toast } = useToast();
  const { logCaseOpening } = useCaseOpeningLogger();

  const startTime = Date.now();

  useEffect(() => {
    const loadCaseSkins = async () => {
      try {
        console.log('📦 [CASE_OPENING] Loading case skins for case:', caseItem?.name);
        
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
          console.error('❌ [CASE_OPENING] Error loading case skins:', error);
          await logCaseOpening({
            user_id: currentUser.id,
            case_id: caseItem.id,
            case_name: caseItem.name,
            is_free: caseItem.is_free,
            phase: 'error',
            error_message: `Failed to load case skins: ${error.message}`
          });
          throw error;
        }
        
        console.log('✅ [CASE_OPENING] Case skins loaded:', data?.length || 0);
        setCaseSkins(data || []);
        
        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: caseItem.is_free,
          phase: 'opening'
        });
      } catch (error) {
        console.error('💥 [CASE_OPENING] Error in loadCaseSkins:', error);
      }
    };

    if (caseItem?.id) {
      loadCaseSkins();
    }
  }, [caseItem?.id, currentUser.id, logCaseOpening]);

  useEffect(() => {
    const startCaseOpening = async () => {
      try {
        console.log('🎯 [CASE_OPENING] Starting case opening process');
        console.log('📊 [CASE_OPENING] Case data:', {
          id: caseItem?.id,
          name: caseItem?.name,
          is_free: caseItem?.is_free,
          price: caseItem?.price
        });
        console.log('👤 [CASE_OPENING] User data:', {
          id: currentUser?.id,
          username: currentUser?.username,
          coins: currentUser?.coins
        });

        // Phase 1: Opening animation
        setAnimationPhase('opening');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Phase 2: Revealing
        console.log('🔍 [CASE_OPENING] Moving to revealing phase');
        setAnimationPhase('revealing');

        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: caseItem.is_free,
          phase: 'revealing'
        });

        if (caseItem?.is_free) {
          console.log('🆓 [CASE_OPENING] Processing free case');
          await handleFreeCaseOpening();
        } else {
          console.log('💰 [CASE_OPENING] Processing paid case');
          await handlePaidCaseOpening();
        }

      } catch (error: any) {
        console.error('💥 [CASE_OPENING] Case opening error:', error);
        
        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: caseItem.is_free,
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

    if (caseSkins.length > 0) {
      startCaseOpening();
    }
  }, [caseSkins.length]);

  const selectRandomReward = (availableRewards: any[]) => {
    console.log('🎲 [CASE_OPENING] Selecting random reward from:', availableRewards.length, 'options');
    
    const totalProbability = availableRewards.reduce((sum, item) => {
      const prob = item.custom_probability || item.probability || 0;
      return sum + prob;
    }, 0);

    console.log('📊 [CASE_OPENING] Total probability:', totalProbability);

    const random = Math.random() * totalProbability;
    let currentSum = 0;

    for (const item of availableRewards) {
      const prob = item.custom_probability || item.probability || 0;
      currentSum += prob;
      if (random <= currentSum) {
        console.log('🎯 [CASE_OPENING] Selected reward:', {
          type: item.reward_type,
          name: item.reward_type === 'coin_reward' ? item.coin_rewards?.name : item.skins?.name
        });
        return item;
      }
    }

    console.log('⚠️ [CASE_OPENING] Fallback to first reward');
    return availableRewards[0];
  };

  const handlePaidCaseOpening = async () => {
    try {
      console.log('💳 [CASE_OPENING] Processing paid case opening');
      
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
        console.log('🪙 [CASE_OPENING] Opening case with coin reward');
        
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
        
        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: false,
          phase: 'complete',
          reward_type: 'coin_reward',
          reward_data: selectedReward.coin_rewards,
          duration_ms: Date.now() - startTime
        });
      } else {
        console.log('🔫 [CASE_OPENING] Opening case with skin');
        
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
        
        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: false,
          phase: 'complete',
          reward_type: 'skin',
          reward_data: selectedReward.skins,
          duration_ms: Date.now() - startTime
        });
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (selectedReward.reward_type === 'coin_reward') {
        // Check for bonus multiplier for coin rewards
        if (Math.random() < 0.15) { // 15% chance for bonus
          console.log('🎁 [CASE_OPENING] Bonus multiplier triggered');
          setShowBonusRoulette(true);
          setAnimationPhase('bonus');
        } else {
          console.log('✅ [CASE_OPENING] Case opening completed normally');
          setIsComplete(true);
          setAnimationPhase('complete');
        }
      } else {
        console.log('✅ [CASE_OPENING] Case opening completed normally');
        setIsComplete(true);
        setAnimationPhase('complete');
      }

    } catch (error: any) {
      console.error('❌ [CASE_OPENING] Paid case opening error:', error);
      
      await logCaseOpening({
        user_id: currentUser.id,
        case_id: caseItem.id,
        case_name: caseItem.name,
        is_free: false,
        phase: 'error',
        error_message: error.message,
        duration_ms: Date.now() - startTime
      });
      
      throw error;
    }
  };

  const handleFreeCaseOpening = async () => {
    try {
      console.log('🆓 [CASE_OPENING] Processing free case opening');
      
      const availableRewards = caseSkins.filter(item => !item.never_drop);
      if (availableRewards.length === 0) {
        throw new Error('В бесплатном кейсе нет доступных наград');
      }

      const selectedReward = selectRandomReward(availableRewards);

      if (selectedReward.reward_type === 'coin_reward') {
        console.log('🪙 [CASE_OPENING] Free case with coin reward');
        
        const { error } = await supabase.rpc('safe_open_case', {
          p_user_id: currentUser.id,
          p_case_id: caseItem.id,
          p_coin_reward_id: selectedReward.coin_rewards.id,
          p_is_free: true
        });

        if (error) throw error;
        
        setWonCoins(selectedReward.coin_rewards.amount);
        onCoinsUpdate(currentUser.coins + selectedReward.coin_rewards.amount);
        
        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: true,
          phase: 'complete',
          reward_type: 'coin_reward',
          reward_data: selectedReward.coin_rewards,
          duration_ms: Date.now() - startTime
        });
      } else {
        console.log('🔫 [CASE_OPENING] Free case with skin');
        
        const { error } = await supabase.rpc('safe_open_case', {
          p_user_id: currentUser.id,
          p_case_id: caseItem.id,
          p_skin_id: selectedReward.skins.id,
          p_is_free: true
        });

        if (error) throw error;
        
        setWonSkin(selectedReward.skins);
        
        await logCaseOpening({
          user_id: currentUser.id,
          case_id: caseItem.id,
          case_name: caseItem.name,
          is_free: true,
          phase: 'complete',
          reward_type: 'skin',
          reward_data: selectedReward.skins,
          duration_ms: Date.now() - startTime
        });
      }

      // Update last free case time
      console.log('⏰ [CASE_OPENING] Updating last free case time');
      await supabase
        .from('users')
        .update({ last_free_case_notification: new Date().toISOString() })
        .eq('id', currentUser.id);

      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ [CASE_OPENING] Free case opening completed');
      setIsComplete(true);
      setAnimationPhase('complete');

    } catch (error: any) {
      console.error('❌ [CASE_OPENING] Free case opening error:', error);
      
      await logCaseOpening({
        user_id: currentUser.id,
        case_id: caseItem.id,
        case_name: caseItem.name,
        is_free: true,
        phase: 'error',
        error_message: error.message,
        duration_ms: Date.now() - startTime
      });
      
      throw error;
    }
  };

  const handleFreeCaseResult = (reward: any) => {
    console.log('🎯 [CASE_OPENING] Free case result received:', reward);
    
    if (reward.reward_type === 'coin_reward') {
      setWonCoins(reward.amount);
    } else {
      setWonSkin(reward);
    }
    setIsComplete(true);
    setAnimationPhase('complete');
  };

  const addToInventory = async () => {
    console.log('📦 [CASE_OPENING] Adding to inventory');
    setIsProcessing(false);
  };

  const sellDirectly = async () => {
    if (!wonSkin) return;
    
    console.log('💰 [CASE_OPENING] Selling skin directly:', wonSkin.name);
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

  const handleBonusComplete = (multiplier: number, finalCoins: number) => {
    console.log('🎁 [CASE_OPENING] Bonus completed:', { multiplier, finalCoins });
    setWonCoins(finalCoins);
    onCoinsUpdate(currentUser.coins - caseItem.price + finalCoins);
    setIsComplete(true);
    setAnimationPhase('complete');
  };

  const handleBonusSkip = () => {
    console.log('⏭️ [CASE_OPENING] Bonus skipped');
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
