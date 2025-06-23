import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateSessionId, storeSessionId, clearSessionId } from '@/utils/sessionUtils';
import { useCaseOpeningLogger } from './useCaseOpeningLogger';
import type { CaseSkin } from '@/utils/supabaseTypes';

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

interface CaseOpeningResponse {
  success: boolean;
  reward?: any;
  inventory_id?: string;
  new_balance?: number;
  roulette_items?: RouletteItem[];
  winner_position?: number;
  error?: string;
  session_id?: string;
}

interface UseCaseOpeningSafeProps {
  caseItem: any;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

export const useCaseOpeningSafe = ({ caseItem, currentUser, onCoinsUpdate }: UseCaseOpeningSafeProps) => {
  const [wonSkin, setWonSkin] = useState<any>(null);
  const [wonCoins, setWonCoins] = useState(0);
  const [actualReward, setActualReward] = useState<any>(null); // Добавляем состояние для реальной награды
  const [isComplete, setIsComplete] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'roulette' | 'complete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rouletteData, setRouletteData] = useState<{
    items: RouletteItem[];
    winnerPosition: number;
  } | null>(null);
  
  const sessionRef = useRef<string | null>(null);
  const hasInitialized = useRef(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logCaseOpening } = useCaseOpeningLogger();

  // Загружаем скины кейса
  const { data: caseSkins = [], isLoading } = useQuery({
    queryKey: ['case-skins', caseItem?.id],
    queryFn: async () => {
      if (!caseItem?.id) return [];
      
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
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        probability: item.probability || 0.01,
        custom_probability: item.custom_probability,
        never_drop: item.never_drop || false,
        reward_type: item.reward_type || 'skin',
        skins: item.skins
      })).filter(item => item.skins);
    },
    enabled: !!caseItem?.id,
    retry: 2,
    staleTime: 30000
  });

  // Функция для безопасного открытия кейса
  const openCaseSafely = useCallback(async () => {
    if (isProcessing || !caseItem || !currentUser) {
      console.log('🚫 [SAFE_CASE_OPENING] Already processing or missing data');
      return;
    }

    console.log('🎯 [SAFE_CASE_OPENING] Starting safe case opening');
    
    setIsProcessing(true);
    setError(null);
    setAnimationPhase('opening');

    try {
      // Генерируем новый ID сессии
      const sessionId = generateSessionId();
      sessionRef.current = sessionId;
      
      // Сохраняем ID сессии
      storeSessionId(currentUser.id, caseItem.id, sessionId);

      console.log('📡 [SAFE_CASE_OPENING] Calling safe RPC with session:', sessionId);

      // Вызываем новую безопасную RPC функцию
      const { data, error } = await supabase.rpc('safe_open_case_with_session', {
        p_user_id: currentUser.id,
        p_case_id: caseItem.id,
        p_session_id: sessionId,
        p_skin_id: null,
        p_coin_reward_id: null,
        p_is_free: caseItem.is_free || false,
        p_ad_watched: false
      });

      if (error) {
        console.error('❌ [SAFE_CASE_OPENING] RPC error:', error);
        throw new Error(error.message || 'Не удалось открыть кейс');
      }

      const response = data as unknown as CaseOpeningResponse;
      console.log('✅ [SAFE_CASE_OPENING] Response received:', response);

      if (!response.success) {
        throw new Error(response.error || 'Не удалось открыть кейс');
      }

      // КРИТИЧЕСКИ ВАЖНО: Сохраняем реальную награду от сервера
      if (response.reward) {
        console.log('🏆 [SAFE_CASE_OPENING] Storing ACTUAL reward from server:', response.reward);
        setActualReward(response.reward);
      }

      // Обновляем баланс
      if (response.new_balance !== undefined) {
        onCoinsUpdate(response.new_balance);
        console.log('💰 [SAFE_CASE_OPENING] Balance updated:', response.new_balance);
      }

      // Enhanced logging for roulette data validation
      if (response.roulette_items && response.winner_position !== undefined) {
        console.log('🎰 [SAFE_CASE_OPENING] Validating roulette data:', {
          itemsCount: response.roulette_items.length,
          winnerPosition: response.winner_position,
          winnerItem: response.roulette_items[response.winner_position],
          actualReward: response.reward,
          itemsMatch: response.roulette_items[response.winner_position]?.id === response.reward?.id
        });
        
        // Verify consistency between winner item and actual reward
        const winnerFromRoulette = response.roulette_items[response.winner_position];
        if (winnerFromRoulette?.id !== response.reward?.id) {
          console.warn('⚠️ [SAFE_CASE_OPENING] MISMATCH DETECTED between roulette winner and actual reward:', {
            winnerFromRoulette,
            actualReward: response.reward
          });
          console.log('✅ [SAFE_CASE_OPENING] Will use ACTUAL reward from server, not roulette item');
        } else {
          console.log('✅ [SAFE_CASE_OPENING] Roulette winner matches actual reward perfectly');
        }
        
        setRouletteData({
          items: response.roulette_items,
          winnerPosition: response.winner_position
        });
        
        // Анимация открытия (1 секунда), затем рулетка
        setTimeout(() => {
          setAnimationPhase('roulette');
        }, 1000);
      } else {
        // Если нет данных рулетки, сразу показываем результат
        handleDirectResult(response.reward);
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

    } catch (error: any) {
      console.error('💥 [SAFE_CASE_OPENING] Error:', error);
      setError(error.message || 'Произошла ошибка при открытии кейса');
      setAnimationPhase(null);
      
      toast({
        title: "Ошибка открытия кейса",
        description: error.message || "Не удалось открыть кейс",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      
      // Очищаем ID сессии через 5 секунд
      setTimeout(() => {
        if (sessionRef.current && caseItem && currentUser) {
          clearSessionId(currentUser.id, caseItem.id);
          sessionRef.current = null;
        }
      }, 5000);
    }
  }, [caseItem, currentUser, isProcessing, onCoinsUpdate, toast, logCaseOpening]);

  const handleDirectResult = useCallback((reward: any) => {
    console.log('🎯 [SAFE_CASE_OPENING] Handling direct result:', reward);
    
    // Используем actualReward если он есть, иначе переданную reward
    const rewardToUse = actualReward || reward;
    console.log('🏆 [SAFE_CASE_OPENING] Using reward for direct result:', rewardToUse);
    
    if (rewardToUse?.type === 'skin') {
      setWonSkin(rewardToUse);
    } else if (rewardToUse?.type === 'coin_reward') {
      setWonCoins(rewardToUse.amount || 0);
    }
    
    setAnimationPhase('complete');
    setTimeout(() => {
      setIsComplete(true);
    }, 1000);
  }, [actualReward]);

  const handleRouletteComplete = useCallback((winnerItem: RouletteItem) => {
    console.log('🏆 [SAFE_CASE_OPENING] Roulette animation complete, winner item from roulette:', {
      winnerItem,
      type: winnerItem.type,
      id: winnerItem.id,
      name: winnerItem.name
    });
    
    console.log('🎯 [SAFE_CASE_OPENING] BUT using ACTUAL reward from server instead:', {
      actualReward,
      serverRewardId: actualReward?.id,
      serverRewardName: actualReward?.name,
      serverRewardType: actualReward?.type
    });
    
    // КРИТИЧЕСКИ ВАЖНО: НЕ используем winnerItem из рулетки!
    // Используем только actualReward от сервера
    if (!actualReward) {
      console.error('❌ [SAFE_CASE_OPENING] No actual reward found, this should not happen!');
      return;
    }
    
    if (actualReward.type === 'skin') {
      console.log('🎨 [SAFE_CASE_OPENING] Setting won skin from SERVER reward:', {
        id: actualReward.id,
        name: actualReward.name,
        price: actualReward.price
      });
      setWonSkin(actualReward);
    } else if (actualReward.type === 'coin_reward') {
      console.log('🪙 [SAFE_CASE_OPENING] Setting won coins from SERVER reward:', {
        id: actualReward.id,
        amount: actualReward.amount
      });
      setWonCoins(actualReward.amount || 0);
    } else {
      console.error('❌ [SAFE_CASE_OPENING] Unknown actual reward type:', actualReward);
    }
    
    // Переключаем только фазу анимации
    setAnimationPhase('complete');
    setTimeout(() => {
      setIsComplete(true);
      console.log('✅ [SAFE_CASE_OPENING] Case opening completed with CORRECT server reward');
    }, 1000);
  }, [actualReward]);

  const addToInventory = useCallback(async () => {
    setIsProcessing(true);
    try {
      console.log('📦 [SAFE_CASE_OPENING] Skin already added to inventory by RPC');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Инвалидируем кэш инвентаря
      queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
    } catch (error) {
      console.error('❌ [SAFE_CASE_OPENING] Error in addToInventory:', error);
      setError('Не удалось добавить в инвентарь');
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser.id, queryClient]);

  const sellDirectly = useCallback(async () => {
    // Используем actualReward вместо wonSkin для продажи
    const rewardToSell = actualReward || wonSkin;
    if (!rewardToSell) return;
    
    setIsProcessing(true);
    try {
      console.log('💰 [SAFE_CASE_OPENING] Selling ACTUAL reward directly:', rewardToSell.name);
      
      const { data, error } = await supabase.rpc('safe_sell_case_reward', {
        p_user_id: currentUser.id,
        p_skin_id: rewardToSell.id,
        p_sell_price: rewardToSell.price
      });

      if (error) throw new Error(error.message);
      
      const result = data as unknown as { success: boolean; new_balance?: number; error?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Не удалось продать скин');
      }

      if (result.new_balance !== undefined) {
        onCoinsUpdate(result.new_balance);
      }
      
      toast({
        title: "Скин продан!",
        description: `Получено ${rewardToSell.price} монет`,
      });
      
      // Инвалидируем кэши
      queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
      
    } catch (error: any) {
      console.error('❌ [SAFE_CASE_OPENING] Sell error:', error);
      toast({
        title: "Ошибка продажи",
        description: error.message || "Не удалось продать скин",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [actualReward, wonSkin, currentUser.id, onCoinsUpdate, toast, queryClient]);

  // Сброс состояния при смене кейса
  useEffect(() => {
    if (caseItem?.id) {
      console.log('🔄 [SAFE_CASE_OPENING] Resetting state for case:', caseItem.name);
      setWonSkin(null);
      setWonCoins(0);
      setActualReward(null); // Сбрасываем actualReward
      setIsComplete(false);
      setAnimationPhase(null);
      setError(null);
      setRouletteData(null);
      hasInitialized.current = false;
      sessionRef.current = null;
    }
  }, [caseItem?.id]);

  return {
    wonSkin: actualReward?.type === 'skin' ? actualReward : wonSkin, // Возвращаем actualReward если это скин
    wonCoins: actualReward?.type === 'coin_reward' ? actualReward.amount : wonCoins, // Возвращаем actualReward если это монеты
    isComplete,
    animationPhase,
    isProcessing,
    addToInventory,
    sellDirectly,
    caseSkins,
    error,
    isLoading,
    rouletteData,
    handleRouletteComplete,
    openCaseSafely
  };
};
