import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCaseOpeningLogger } from './useCaseOpeningLogger';
import type { CaseSkin } from '@/utils/supabaseTypes';

export const useCaseOpening = (caseId: string | null) => {
  const [isOpening, setIsOpening] = useState(false);
  const { logCaseOpening } = useCaseOpeningLogger();

  const { data: caseSkins = [], isLoading } = useQuery({
    queryKey: ['case-skins', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      
      try {
        const { data, error } = await supabase
          .from('case_skins')
          .select(`
            id,
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
          .eq('case_id', caseId)
          .eq('never_drop', false);
        
        if (error) {
          console.error('Error loading case skins:', error);
          throw error;
        }
        
        // Transform the data to match our CaseSkin interface
        const transformedData: CaseSkin[] = (data || []).map(item => ({
          id: item.id,
          probability: item.probability,
          custom_probability: item.custom_probability,
          never_drop: item.never_drop,
          reward_type: item.reward_type,
          skins: item.skins || undefined,
          coin_rewards: item.coin_rewards || undefined
        }));
        
        return transformedData;
      } catch (error) {
        console.error('Case skins query error:', error);
        return [];
      }
    },
    enabled: !!caseId
  });

  const openCase = async (userId: string, isFree: boolean, caseName: string) => {
    if (!caseId) {
      console.error('❌ [CASE_OPENING] Case ID is null or undefined.');
      return { success: false, error: 'Case ID is required' };
    }

    if (isOpening) {
      console.warn('⚠️ [CASE_OPENING] Case opening already in progress.');
      return { success: false, error: 'Case opening already in progress' };
    }

    setIsOpening(true);
    const startTime = Date.now();
    let rewardType: 'skin' | 'coin_reward' | undefined;
    let rewardData: any;
    let errorMessage: string | undefined;

    try {
      logCaseOpening({
        user_id: userId,
        case_id: caseId,
        case_name: caseName,
        is_free: isFree,
        phase: 'opening'
      });

      // 1. Select a random skin or coin reward based on probabilities
      const randomNumber = Math.random();
      let cumulativeProbability = 0;
      let selectedCaseSkin: CaseSkin | undefined;

      for (const caseSkin of caseSkins) {
        const probability = caseSkin.custom_probability !== null && caseSkin.custom_probability !== undefined
          ? caseSkin.custom_probability
          : caseSkin.probability || 0;

        cumulativeProbability += probability;
        if (randomNumber <= cumulativeProbability) {
          selectedCaseSkin = caseSkin;
          break;
        }
      }

      if (!selectedCaseSkin) {
        console.error('❌ [CASE_OPENING] No skin or coin reward selected. Check probabilities.');
        errorMessage = 'No skin or coin reward selected. Check probabilities.';
        logCaseOpening({
          user_id: userId,
          case_id: caseId,
          case_name: caseName,
          is_free: isFree,
          phase: 'error',
          error_message: errorMessage
        });
        return { success: false, error: errorMessage };
      }

      // 2. Open the case using the selected skin or coin reward
      let result;
      if (selectedCaseSkin.reward_type === 'coin_reward' && selectedCaseSkin.coin_rewards) {
        rewardType = 'coin_reward';
        rewardData = selectedCaseSkin.coin_rewards;
        logCaseOpening({
          user_id: userId,
          case_id: caseId,
          case_name: caseName,
          is_free: isFree,
          phase: 'revealing',
          reward_type: rewardType,
          reward_data: rewardData
        });

        const { data, error } = await supabase.rpc('safe_open_case', {
          p_user_id: userId,
          p_case_id: caseId,
          p_skin_id: null,
          p_coin_reward_id: selectedCaseSkin.coin_rewards.id,
          p_is_free: isFree
        });

        if (error) {
          console.error('❌ [CASE_OPENING] Error opening case with coin reward:', error);
          errorMessage = `Error opening case with coin reward: ${error.message}`;
          logCaseOpening({
            user_id: userId,
            case_id: caseId,
            case_name: caseName,
            is_free: isFree,
            phase: 'error',
            reward_type: rewardType,
            reward_data: rewardData,
            error_message: errorMessage
          });
          return { success: false, error: errorMessage };
        }
        result = data;
      } else {
        rewardType = 'skin';
        rewardData = selectedCaseSkin.skins;
        logCaseOpening({
          user_id: userId,
          case_id: caseId,
          case_name: caseName,
          is_free: isFree,
          phase: 'revealing',
          reward_type: rewardType,
          reward_data: rewardData
        });

        const { data, error } = await supabase.rpc('safe_open_case', {
          p_user_id: userId,
          p_case_id: caseId,
          p_skin_id: selectedCaseSkin.skins?.id,
          p_coin_reward_id: null,
          p_is_free: isFree
        });

        if (error) {
          console.error('❌ [CASE_OPENING] Error opening case with skin:', error);
          errorMessage = `Error opening case with skin: ${error.message}`;
          logCaseOpening({
            user_id: userId,
            case_id: caseId,
            case_name: caseName,
            is_free: isFree,
            phase: 'error',
            reward_type: rewardType,
            reward_data: rewardData,
            error_message: errorMessage
          });
          return { success: false, error: errorMessage };
        }
        result = data;
      }

      if (!result || !result.success) {
        console.error('❌ [CASE_OPENING] Failed to open case:', result?.error);
        errorMessage = `Failed to open case: ${result?.error || 'Unknown error'}`;
        logCaseOpening({
          user_id: userId,
          case_id: caseId,
          case_name: caseName,
          is_free: isFree,
          phase: 'error',
          reward_type: rewardType,
          reward_data: rewardData,
          error_message: errorMessage
        });
        return { success: false, error: errorMessage };
      }

      const duration = Date.now() - startTime;
      logCaseOpening({
        user_id: userId,
        case_id: caseId,
        case_name: caseName,
        is_free: isFree,
        phase: 'complete',
        reward_type: rewardType,
        reward_data: rewardData,
        duration_ms: duration
      });

      console.log(`🎉 [CASE_OPENING] Case opened successfully in ${duration}ms!`, { rewardType, rewardData });
      return { success: true, reward: result.reward, inventoryId: result.inventory_id };
    } catch (error) {
      console.error('💥 [CASE_OPENING] Unexpected error during case opening:', error);
      errorMessage = `Unexpected error during case opening: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logCaseOpening({
        user_id: userId,
        case_id: caseId,
        case_name: caseName,
        is_free: isFree,
        phase: 'error',
        error_message: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsOpening(false);
    }
  };

  return {
    caseSkins,
    isLoading,
    isOpening,
    openCase
  };
};
