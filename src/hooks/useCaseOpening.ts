
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCaseOpeningLogger } from './useCaseOpeningLogger';
import { useToast } from '@/hooks/use-toast';
import type { CaseSkin } from '@/utils/supabaseTypes';
import type { SafeOpenCaseResponse } from '@/types/rpc';

interface UseCaseOpeningProps {
  caseItem: any;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

interface RouletteItem {
  id: string;
  name: string;
  weapon_type?: string;
  rarity?: string;
  price: number;
  image_url?: string | null;
  type: 'skin' | 'coin_reward';
  amount?: number;
}

export const useCaseOpening = ({ caseItem, currentUser, onCoinsUpdate }: UseCaseOpeningProps) => {
  const [wonSkin, setWonSkin] = useState<any>(null);
  const [wonCoins, setWonCoins] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'roulette' | 'complete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rouletteData, setRouletteData] = useState<{
    items: RouletteItem[];
    winnerPosition: number;
  } | null>(null);
  
  const { logCaseOpening } = useCaseOpeningLogger();
  const { toast } = useToast();

  // Загружаем скины кейса
  const { data: caseSkins = [], isLoading } = useQuery({
    queryKey: ['case-skins', caseItem?.id],
    queryFn: async () => {
      if (!caseItem?.id) return [];
      
      try {
        console.log('🔍 [CASE_OPENING] Loading skins for case:', caseItem.id);
        
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
          console.error('❌ [CASE_OPENING] Error loading case skins:', error);
          throw new Error(`Failed to load case contents: ${error.message}`);
        }
        
        const transformedData: CaseSkin[] = (data || []).map(item => ({
          id: item.id,
          probability: item.probability || 0.01,
          custom_probability: item.custom_probability,
          never_drop: item.never_drop || false,
          reward_type: item.reward_type || 'skin',
          skins: item.skins
        })).filter(item => item.skins);
        
        console.log('✅ [CASE_OPENING] Loaded case skins:', transformedData.length);
        
        if (transformedData.length === 0) {
          throw new Error('Этот кейс не содержит доступных предметов');
        }
        
        return transformedData;
      } catch (error) {
        console.error('💥 [CASE_OPENING] Case skins query error:', error);
        throw error;
      }
    },
    enabled: !!caseItem?.id,
    retry: 2,
    staleTime: 30000
  });

  useEffect(() => {
    if (caseItem && currentUser && caseSkins.length > 0 && !error) {
      startCaseOpening();
    }
  }, [caseItem, currentUser, caseSkins, error]);

  const startCaseOpening = async () => {
    console.log('🚀 [CASE_OPENING] Starting case opening for:', caseItem.name);
    setError(null);
    setAnimationPhase('opening');

    // Проверяем баланс для платных кейсов
    if (!caseItem.is_free && currentUser.coins < caseItem.price) {
      const errorMsg = `Недостаточно монет. Нужно: ${caseItem.price}, у вас: ${currentUser.coins}`;
      setError(errorMsg);
      setAnimationPhase(null);
      toast({
        title: "Недостаточно монет",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Анимация открытия
    setTimeout(() => {
      setAnimationPhase('roulette');
      openCaseWithRPC();
    }, 2000);
  };

  const openCaseWithRPC = async () => {
    if (caseSkins.length === 0) {
      console.error('❌ [CASE_OPENING] No skins available for case');
      setError('В кейсе нет доступных предметов');
      return;
    }

    try {
      console.log('🎯 [CASE_OPENING] Selecting random skin from', caseSkins.length, 'options');
      
      // Выбираем случайный скин на основе вероятностей
      let totalProbability = caseSkins.reduce((sum, skin) => sum + (skin.probability || 0.01), 0);
      let random = Math.random() * totalProbability;
      let selectedSkin = caseSkins[0]; // fallback
      
      for (const skin of caseSkins) {
        random -= (skin.probability || 0.01);
        if (random <= 0) {
          selectedSkin = skin;
          break;
        }
      }

      if (!selectedSkin.skins) {
        throw new Error('Выбранный скин не найден');
      }

      console.log('🎁 [CASE_OPENING] Selected skin:', selectedSkin.skins.name);

      // Вызываем RPC функцию с всеми 5 параметрами
      const { data, error } = await supabase.rpc('safe_open_case', {
        p_user_id: currentUser.id,
        p_case_id: caseItem.id,
        p_skin_id: selectedSkin.skins.id,
        p_coin_reward_id: null,
        p_is_free: caseItem.is_free || false
      });

      if (error) {
        console.error('❌ [CASE_OPENING] RPC error:', error);
        throw new Error(error.message || 'Не удалось открыть кейс');
      }

      const response = data as unknown as SafeOpenCaseResponse;
      
      if (!response.success) {
        if (response.error === 'Insufficient funds') {
          throw new Error(`Недостаточно монет. Нужно: ${response.required}, у вас: ${response.current}`);
        }
        throw new Error(response.error || 'Сервер не вернул успешный результат');
      }

      console.log('✅ [CASE_OPENING] Case opened successfully:', response);
      
      // Устанавливаем данные рулетки
      if (response.roulette_items && response.winner_position !== undefined) {
        setRouletteData({
          items: response.roulette_items,
          winnerPosition: response.winner_position
        });
      }
      
      // Обновляем баланс пользователя
      if (response.new_balance !== undefined) {
        onCoinsUpdate(response.new_balance);
        console.log('💰 [CASE_OPENING] Balance updated to:', response.new_balance);
      }
      
      // Логируем успешное открытие
      await logCaseOpening({
        user_id: currentUser.id,
        case_id: caseItem.id,
        case_name: caseItem.name,
        is_free: caseItem.is_free || false,
        phase: 'complete',
        reward_type: response.reward?.type || 'skin',
        reward_data: response.reward
      });

    } catch (error) {
      console.error('💥 [CASE_OPENING] Error in openCaseWithRPC:', error);
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при открытии кейса';
      setError(errorMessage);
      setAnimationPhase(null);
      
      toast({
        title: "Ошибка открытия кейса",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRouletteComplete = (winnerItem: RouletteItem) => {
    console.log('🏆 [CASE_OPENING] Roulette complete, winner:', winnerItem);
    
    if (winnerItem.type === 'skin') {
      setWonSkin(winnerItem);
    } else if (winnerItem.type === 'coin_reward') {
      setWonCoins(winnerItem.amount || 0);
    }
    
    setAnimationPhase('complete');
    setTimeout(() => {
      setIsComplete(true);
    }, 1000);
  };

  const addToInventory = async () => {
    setIsProcessing(true);
    try {
      console.log('📦 [CASE_OPENING] Skin already added to inventory by RPC function');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ [CASE_OPENING] Inventory action completed');
    } catch (error) {
      console.error('❌ [CASE_OPENING] Error in addToInventory:', error);
      setError('Не удалось добавить в инвентарь');
    } finally {
      setIsProcessing(false);
    }
  };

  const sellDirectly = async () => {
    setIsProcessing(true);
    try {
      if (wonSkin) {
        console.log('💰 [CASE_OPENING] Selling skin directly for', wonSkin.price, 'coins');
        const newCoins = currentUser.coins + wonSkin.price;
        onCoinsUpdate(newCoins);
        console.log('✅ [CASE_OPENING] Direct sale completed, new balance:', newCoins);
        
        toast({
          title: "Скин продан!",
          description: `Получено ${wonSkin.price} монет`,
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('❌ [CASE_OPENING] Error in sellDirectly:', error);
      setError('Не удалось продать скин');
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
    addToInventory,
    sellDirectly,
    caseSkins,
    error,
    isLoading,
    rouletteData,
    handleRouletteComplete
  };
};
