import { useState, useEffect, useRef } from 'react';
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
  
  const [hasStarted, setHasStarted] = useState(false);
  const isProcessingRef = useRef(false);
  
  const { logCaseOpening } = useCaseOpeningLogger();
  const { toast } = useToast();

  // Загружаем скины кейса для проверки, что кейс не пустой
  const { data: caseSkins = [], isLoading } = useQuery({
    queryKey: ['case-skins', caseItem?.id],
    queryFn: async () => {
      if (!caseItem?.id) {
        console.error('❌ [CASE_OPENING] No case ID provided');
        return [];
      }
      
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
          console.warn('⚠️ [CASE_OPENING] Case has no available items');
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

  // Запускаем открытие кейса только один раз при инициализации
  useEffect(() => {
    if (caseItem && currentUser && caseSkins.length > 0 && !error && !hasStarted && !isProcessingRef.current) {
      console.log('🚀 [CASE_OPENING] Starting case opening process (ONCE)');
      console.log('📊 [CASE_OPENING] Case details:', {
        caseId: caseItem.id,
        caseName: caseItem.name,
        price: caseItem.price,
        isFree: caseItem.is_free,
        availableSkins: caseSkins.length
      });
      console.log('👤 [CASE_OPENING] User details:', {
        userId: currentUser.id,
        username: currentUser.username,
        coins: currentUser.coins
      });
      
      setHasStarted(true);
      isProcessingRef.current = true;
      startCaseOpening();
    }
  }, [caseItem, currentUser, caseSkins, error, hasStarted]);

  // Сброс состояния при смене кейса
  useEffect(() => {
    if (caseItem?.id) {
      console.log('🔄 [CASE_OPENING] Resetting state for new case');
      setWonSkin(null);
      setWonCoins(0);
      setIsComplete(false);
      setAnimationPhase(null);
      setError(null);
      setRouletteData(null);
      setHasStarted(false);
      isProcessingRef.current = false;
    }
  }, [caseItem?.id]);

  const startCaseOpening = async () => {
    try {
      console.log('🎯 [CASE_OPENING] Starting case opening for:', caseItem.name);
      console.log('💰 [CASE_OPENING] User balance:', currentUser.coins);
      console.log('💳 [CASE_OPENING] Case price:', caseItem.price);
      console.log('🆓 [CASE_OPENING] Is free case:', caseItem.is_free);
      
      setError(null);
      setAnimationPhase('opening');

      // Проверяем баланс для платных кейсов
      if (!caseItem.is_free && currentUser.coins < caseItem.price) {
        const errorMsg = `Недостаточно монет. Нужно: ${caseItem.price}, у вас: ${currentUser.coins}`;
        console.error('❌ [CASE_OPENING] Insufficient funds:', errorMsg);
        setError(errorMsg);
        setAnimationPhase(null);
        isProcessingRef.current = false;
        toast({
          title: "Недостаточно монет",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      // Проверяем, что в кейсе есть предметы
      if (caseSkins.length === 0) {
        const errorMsg = 'В этом кейсе нет доступных предметов';
        console.error('❌ [CASE_OPENING] No items in case');
        setError(errorMsg);
        setAnimationPhase(null);
        isProcessingRef.current = false;
        return;
      }

      // Анимация открытия (2 секунды)
      console.log('⏰ [CASE_OPENING] Starting opening animation');
      setTimeout(() => {
        console.log('⏰ [CASE_OPENING] Opening animation complete, calling RPC');
        openCaseWithRPC();
      }, 2000);
    } catch (error) {
      console.error('💥 [CASE_OPENING] Error in startCaseOpening:', error);
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при запуске открытия кейса';
      setError(errorMessage);
      setAnimationPhase(null);
      isProcessingRef.current = false;
    }
  };

  const openCaseWithRPC = async () => {
    try {
      console.log('📡 [CASE_OPENING] Calling RPC function safe_open_case');
      
      const { data, error } = await supabase.rpc('safe_open_case', {
        p_user_id: currentUser.id,
        p_case_id: caseItem.id,
        p_skin_id: null,
        p_coin_reward_id: null,
        p_is_free: caseItem.is_free || false,
        p_ad_watched: false
      });

      console.log('📋 [CASE_OPENING] Raw RPC response:', { data, error });

      if (error) {
        console.error('❌ [CASE_OPENING] RPC error details:', error);
        throw new Error(`Ошибка сервера: ${error.message}`);
      }

      if (!data) {
        console.error('❌ [CASE_OPENING] RPC returned null data');
        throw new Error('Сервер не вернул данных');
      }

      const response = data as unknown as SafeOpenCaseResponse;
      console.log('📋 [CASE_OPENING] Parsed response:', response);
      
      if (!response.success) {
        console.error('❌ [CASE_OPENING] RPC returned failure:', response);
        if (response.error === 'Insufficient funds') {
          throw new Error(`Недостаточно монет. Нужно: ${response.required}, у вас: ${response.current}`);
        }
        throw new Error(response.error || 'Сервер не вернул успешный результат');
      }

      console.log('✅ [CASE_OPENING] Case opened successfully');
      console.log('🎁 [CASE_OPENING] Reward received:', response.reward);
      
      // Update user balance
      if (response.new_balance !== undefined) {
        onCoinsUpdate(response.new_balance);
        console.log('💰 [CASE_OPENING] Balance updated to:', response.new_balance);
      }
      
      // Enhanced logging for roulette data
      if (response.roulette_items && response.winner_position !== undefined) {
        console.log('🎰 [CASE_OPENING] Setting roulette data with enhanced validation:', {
          itemsCount: response.roulette_items.length,
          winnerPosition: response.winner_position,
          winnerItem: response.roulette_items[response.winner_position],
          actualReward: response.reward,
          itemsMatch: response.roulette_items[response.winner_position]?.id === response.reward?.id,
          allRouletteItems: response.roulette_items.map((item, index) => ({
            position: index,
            id: item.id,
            name: item.name,
            type: item.type,
            isWinner: index === response.winner_position
          }))
        });
        
        // Verify that the winner item matches the actual reward
        const winnerFromRoulette = response.roulette_items[response.winner_position];
        const actualReward = response.reward;
        
        if (winnerFromRoulette?.id !== actualReward?.id) {
          console.error('⚠️ [CASE_OPENING] MISMATCH DETECTED:', {
            winnerFromRoulette,
            actualReward,
            position: response.winner_position
          });
        } else {
          console.log('✅ [CASE_OPENING] Winner item matches actual reward perfectly');
        }
        
        setRouletteData({
          items: response.roulette_items,
          winnerPosition: response.winner_position
        });
        setAnimationPhase('roulette');
      } else {
        console.log('⚡ [CASE_OPENING] No roulette data, showing direct result');
        handleDirectResult(response.reward);
      }
      
      // Log successful opening
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
      console.error('💥 [CASE_OPENING] Error message for user:', errorMessage);
      setError(errorMessage);
      setAnimationPhase(null);
      isProcessingRef.current = false;
      
      toast({
        title: "Ошибка открытия кейса",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDirectResult = (reward: any) => {
    console.log('🎯 [CASE_OPENING] Handling direct result:', reward);
    
    if (reward?.type === 'skin') {
      console.log('🎨 [CASE_OPENING] Setting won skin:', reward.name);
      setWonSkin(reward);
    } else if (reward?.type === 'coin_reward') {
      console.log('🪙 [CASE_OPENING] Setting won coins:', reward.amount);
      setWonCoins(reward.amount || 0);
    } else {
      console.warn('⚠️ [CASE_OPENING] Unknown reward type:', reward);
    }
    
    setAnimationPhase('complete');
    setTimeout(() => {
      setIsComplete(true);
      isProcessingRef.current = false;
    }, 1000);
  };

  const handleRouletteComplete = (winnerItem: RouletteItem) => {
    console.log('🏆 [CASE_OPENING] Roulette complete, processing winner:', {
      winnerItem,
      type: winnerItem.type,
      id: winnerItem.id,
      name: winnerItem.name
    });
    
    // Enhanced validation to ensure we're using the correct winner
    if (!winnerItem) {
      console.error('❌ [CASE_OPENING] No winner item provided to handleRouletteComplete');
      return;
    }
    
    // Use the winner from roulette animation (this should now match the actual reward)
    if (winnerItem.type === 'skin') {
      console.log('🎨 [CASE_OPENING] Winner is skin:', {
        id: winnerItem.id,
        name: winnerItem.name,
        price: winnerItem.price
      });
      setWonSkin(winnerItem);
    } else if (winnerItem.type === 'coin_reward') {
      console.log('🪙 [CASE_OPENING] Winner is coins:', {
        id: winnerItem.id,
        amount: winnerItem.amount
      });
      setWonCoins(winnerItem.amount || 0);
    } else {
      console.error('❌ [CASE_OPENING] Unknown winner item type:', winnerItem);
    }
    
    setAnimationPhase('complete');
    setTimeout(() => {
      setIsComplete(true);
      isProcessingRef.current = false;
      console.log('✅ [CASE_OPENING] Case opening process completed successfully');
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
        console.log('💰 [CASE_OPENING] Starting direct sell with secure RPC function');
        console.log('💰 [CASE_OPENING] Selling skin:', {
          skinId: wonSkin.id,
          skinName: wonSkin.name,
          price: wonSkin.price,
          userId: currentUser.id
        });
        
        // Используем новую безопасную RPC функцию для прямой продажи
        const { data, error: sellError } = await supabase.rpc('safe_sell_case_reward', {
          p_user_id: currentUser.id,
          p_skin_id: wonSkin.id,
          p_sell_price: wonSkin.price
        });

        if (sellError) {
          console.error('❌ [CASE_OPENING] RPC error:', sellError);
          throw new Error(sellError.message || 'Не удалось продать скин');
        }

        if (!data) {
          throw new Error('Сервер не вернул результат операции');
        }

        // Типизируем ответ от RPC функции
        const result = data as unknown as { success: boolean; new_balance?: number; error?: string };

        if (!result.success) {
          throw new Error(result.error || 'Операция продажи не была выполнена');
        }

        // Обновляем баланс пользователя
        if (result.new_balance !== undefined) {
          onCoinsUpdate(result.new_balance);
          console.log('✅ [CASE_OPENING] Direct sale completed, new balance:', result.new_balance);
        }
        
        toast({
          title: "Скин продан!",
          description: `Получено ${wonSkin.price} монет`,
        });
      }
    } catch (error) {
      console.error('❌ [CASE_OPENING] Error in sellDirectly:', error);
      const errorMessage = error instanceof Error ? error.message : 'Не удалось продать скин';
      setError(errorMessage);
      toast({
        title: "Ошибка продажи",
        description: errorMessage,
        variant: "destructive",
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
    addToInventory,
    sellDirectly,
    caseSkins,
    error,
    isLoading,
    rouletteData,
    handleRouletteComplete
  };
};
