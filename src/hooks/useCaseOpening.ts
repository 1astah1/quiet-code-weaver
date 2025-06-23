import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCaseOpeningLogger } from './useCaseOpeningLogger';
import type { CaseSkin } from '@/utils/supabaseTypes';

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
  const [wonCoins, setWonCoins] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'revealing' | 'bonus' | null>('opening');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBonusRoulette, setShowBonusRoulette] = useState(false);
  const { logCaseOpening } = useCaseOpeningLogger();

  const { data: caseSkins = [], isLoading } = useQuery({
    queryKey: ['case-skins', caseItem?.id],
    queryFn: async () => {
      if (!caseItem?.id) return [];
      
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
          .eq('case_id', caseItem.id)
          .eq('never_drop', false);
        
        if (error) {
          console.error('Error loading case skins:', error);
          throw error;
        }
        
        // Transform the data to match our CaseSkin interface, handling potential errors
        const transformedData: CaseSkin[] = (data || []).map(item => {
          // Safe coin_rewards handling
          const coinRewards = item.coin_rewards && 
                             item.coin_rewards !== null && 
                             typeof item.coin_rewards === 'object' && 
                             !Array.isArray(item.coin_rewards) &&
                             !('error' in (item.coin_rewards as any))
            ? (item.coin_rewards as { id: string; name: string; amount: number; image_url?: string })
            : undefined;

          return {
            id: item.id,
            probability: item.probability,
            custom_probability: item.custom_probability,
            never_drop: item.never_drop,
            reward_type: item.reward_type,
            skins: item.skins || undefined,
            coin_rewards: coinRewards
          };
        }).filter(item => item.skins || item.coin_rewards);
        
        return transformedData;
      } catch (error) {
        console.error('Case skins query error:', error);
        return [];
      }
    },
    enabled: !!caseItem?.id
  });

  useEffect(() => {
    if (caseItem && currentUser && caseSkins.length > 0) {
      startCaseOpening();
    }
  }, [caseItem, currentUser, caseSkins]);

  const startCaseOpening = async () => {
    console.log('Starting case opening animation');
    setAnimationPhase('opening');

    // Opening phase
    setTimeout(() => {
      setAnimationPhase('revealing');
      simulateCaseResult();
    }, 2000);
  };

  const simulateCaseResult = () => {
    if (caseSkins.length === 0) return;

    // Simple random selection for demo
    const randomIndex = Math.floor(Math.random() * caseSkins.length);
    const selectedItem = caseSkins[randomIndex];

    if (selectedItem.reward_type === 'coin_reward' && selectedItem.coin_rewards) {
      setWonCoins(selectedItem.coin_rewards.amount);
      setShowBonusRoulette(true);
      setAnimationPhase('bonus');
    } else if (selectedItem.skins) {
      setWonSkin(selectedItem.skins);
      setTimeout(() => {
        setIsComplete(true);
        setAnimationPhase(null);
      }, 3000);
    }
  };

  const addToInventory = async () => {
    setIsProcessing(true);
    // Simulate adding to inventory
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  };

  const sellDirectly = async () => {
    setIsProcessing(true);
    if (wonSkin) {
      const newCoins = currentUser.coins + wonSkin.price;
      onCoinsUpdate(newCoins);
    }
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  };

  const handleBonusComplete = (multiplier: number, finalCoins: number) => {
    const newCoins = currentUser.coins + finalCoins;
    onCoinsUpdate(newCoins);
    setIsComplete(true);
  };

  const handleBonusSkip = () => {
    const newCoins = currentUser.coins + wonCoins;
    onCoinsUpdate(newCoins);
    setIsComplete(true);
  };

  const handleFreeCaseResult = (result: any) => {
    if (result.type === 'skin') {
      setWonSkin(result);
    } else {
      setWonCoins(result.amount);
    }
    setTimeout(() => {
      setIsComplete(true);
      setAnimationPhase(null);
    }, 2000);
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
