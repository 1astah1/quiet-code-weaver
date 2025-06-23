
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCaseOpeningLogger } from './useCaseOpeningLogger';
import { useSecureCaseOpening } from './useSecureCaseOpening';
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
  const secureCaseOpening = useSecureCaseOpening();

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
            skins!inner (
              id,
              name,
              weapon_type,
              rarity,
              price,
              image_url
            )
          `)
          .eq('case_id', caseItem.id)
          .eq('never_drop', false)
          .not('skins', 'is', null);
        
        if (error) {
          console.error('Error loading case skins:', error);
          return [];
        }
        
        const transformedData: CaseSkin[] = (data || []).map(item => ({
          id: item.id,
          probability: item.probability || 0.01,
          custom_probability: item.custom_probability,
          never_drop: item.never_drop || false,
          reward_type: item.reward_type || 'skin',
          skins: item.skins
        })).filter(item => item.skins);
        
        console.log('Case skins loaded:', transformedData.length);
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

  const simulateCaseResult = async () => {
    if (caseSkins.length === 0) return;

    // Simple random selection for demo
    const randomIndex = Math.floor(Math.random() * caseSkins.length);
    const selectedItem = caseSkins[randomIndex];

    if (selectedItem.skins) {
      try {
        // Используем новую безопасную функцию открытия кейса
        const result = await secureCaseOpening.mutateAsync({
          userId: currentUser.id,
          caseId: caseItem.id,
          skinId: selectedItem.skins.id,
          isFree: caseItem.is_free || false
        });

        if (result.success && result.skin) {
          setWonSkin(result.skin);
          
          // Обновляем баланс пользователя (если кейс платный, он уже списан)
          if (!caseItem.is_free) {
            const newCoins = currentUser.coins - caseItem.price;
            onCoinsUpdate(Math.max(0, newCoins));
          }
        }
      } catch (error) {
        console.error('Error opening case:', error);
        // В случае ошибки показываем скин без реального открытия
        setWonSkin(selectedItem.skins);
      }

      setTimeout(() => {
        setIsComplete(true);
        setAnimationPhase(null);
      }, 3000);
    }
  };

  const addToInventory = async () => {
    setIsProcessing(true);
    // Скин уже добавлен в инвентарь через safe_open_case
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
