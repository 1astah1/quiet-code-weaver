
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

export const useCaseOpeningFixed = ({ caseItem, currentUser, onCoinsUpdate }: UseCaseOpeningProps) => {
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
  
  // Флаги для предотвращения повторных запусков
  const [hasStarted, setHasStarted] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const isProcessingRef = useRef(false);
  const componentMountedRef = useRef(true);
  
  const { logCaseOpening } = useCaseOpeningLogger();
  const { toast } = useToast();

  // Валидация данных рулетки
  const validateRouletteData = (data: any): boolean => {
    if (!data || !Array.isArray(data.items) || data.items.length === 0) {
      console.error('❌ Invalid roulette data: missing or empty items');
      return false;
    }
    
    if (typeof data.winnerPosition !== 'number' || data.winnerPosition < 0 || data.winnerPosition >= data.items.length) {
      console.error('❌ Invalid winner position:', data.winnerPosition);
      return false;
    }
    
    return true;
  };

  // Загружаем скины кейса
  const { data: caseSkins = [], isLoading } = useQuery({
    queryKey: ['case-skins', caseItem?.id],
    queryFn: async () => {
      if (!caseItem?.id) {
        console.error('❌ No case ID provided');
        return [];
      }
      
      try {
        console.log('🔍 Loading skins for case:', caseItem.id);
        
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
          console.error('❌ Error loading case skins:', error);
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
        
        console.log('✅ Loaded case skins:', transformedData.length);
        
        if (transformedData.length === 0) {
          throw new Error('Этот кейс не содержит доступных предметов');
        }
        
        return transformedData;
      } catch (error) {
        console.error('💥 Case skins query error:', error);
        throw error;
      }
    },
    enabled: !!caseItem?.id,
    retry: 2,
    staleTime: 30000
  });

  // Эффект для сброса состояния при смене кейса
  useEffect(() => {
    if (caseItem?.id) {
      console.log('🔄 Resetting state for new case:', caseItem.id);
      setWonSkin(null);
      setWonCoins(0);
      setIsComplete(false);
      setAnimationPhase(null);
      setError(null);
      setRouletteData(null);
      setHasStarted(false);
      setHasOpened(false);
      isProcessingRef.current = false;
      componentMountedRef.current = true;
    }
  }, [caseItem?.id]);

  // Эффект для запуска открытия кейса
  useEffect(() => {
    const shouldStart = caseItem && 
                      currentUser && 
                      caseSkins.length > 0 && 
                      !error && 
                      !hasStarted && 
                      !hasOpened &&
                      !isProcessingRef.current &&
                      componentMountedRef.current;

    if (shouldStart) {
      console.log('🚀 Starting case opening process');
      setHasStarted(true);
      isProcessingRef.current = true;
      startCaseOpening();
    }
  }, [caseItem, currentUser, caseSkins, error, hasStarted, hasOpened]);

  const startCaseOpening = async () => {
    try {
      console.log('🎯 Starting case opening for:', caseItem.name);
      
      if (hasOpened) {
        console.log('⚠️ Case already opened, skipping');
        return;
      }
      
      setError(null);
      setAnimationPhase('opening');

      // Проверяем баланс для платных кейсов
      if (!caseItem.is_free && currentUser.coins < caseItem.price) {
        const errorMsg = `Недостаточно монет. Нужно: ${caseItem.price}, у вас: ${currentUser.coins}`;
        console.error('❌ Insufficient funds:', errorMsg);
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

      // Анимация открытия (2 секунды)
      console.log('⏰ Starting opening animation');
      setTimeout(() => {
        if (componentMountedRef.current && !hasOpened) {
          console.log('⏰ Opening animation complete, calling RPC');
          openCaseWithRPC();
        }
      }, 2000);
    } catch (error) {
      console.error('💥 Error in startCaseOpening:', error);
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при запуске открытия кейса';
      setError(errorMessage);
      setAnimationPhase(null);
      isProcessingRef.current = false;
    }
  };

  const openCaseWithRPC = async () => {
    try {
      if (hasOpened) {
        console.log('⚠️ Case already opened via RPC, skipping');
        return;
      }

      setHasOpened(true);
      console.log('📡 Calling RPC function safe_open_case');
      
      const { data, error } = await supabase.rpc('safe_open_case', {
        p_user_id: currentUser.id,
        p_case_id: caseItem.id,
        p_skin_id: null,
        p_coin_reward_id: null,
        p_is_free: caseItem.is_free || false
      });

      console.log('📋 RPC response received:', data);

      if (error) {
        console.error('❌ RPC error:', error);
        throw new Error(`Ошибка сервера: ${error.message}`);
      }

      if (!data) {
        console.error('❌ RPC returned null data');
        throw new Error('Сервер не вернул данных');
      }

      const response = data as unknown as SafeOpenCaseResponse;
      
      if (!response.success) {
        console.error('❌ RPC returned failure:', response);
        if (response.error === 'Insufficient funds') {
          throw new Error(`Недостаточно монет. Нужно: ${response.required}, у вас: ${response.current}`);
        }
        throw new Error(response.error || 'Сервер не вернул успешный результат');
      }

      console.log('✅ Case opened successfully');
      
      // Обновляем баланс пользователя
      if (response.new_balance !== undefined) {
        onCoinsUpdate(response.new_balance);
        console.log('💰 Balance updated to:', response.new_balance);
      }
      
      // Проверяем и устанавливаем данные рулетки
      if (response.roulette_items && response.winner_position !== undefined) {
        const rouletteDataToSet = {
          items: response.roulette_items,
          winnerPosition: response.winner_position
        };

        if (validateRouletteData(rouletteDataToSet)) {
          console.log('🎰 Setting valid roulette data');
          setRouletteData(rouletteDataToSet);
          setAnimationPhase('roulette');
        } else {
          console.log('⚡ Invalid roulette data, showing direct result');
          handleDirectResult(response.reward);
        }
      } else {
        console.log('⚡ No roulette data, showing direct result');
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

    } catch (error) {
      console.error('💥 Error in openCaseWithRPC:', error);
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при открытии кейса';
      setError(errorMessage);
      setAnimationPhase(null);
      isProcessingRef.current = false;
      setHasOpened(false); // Сбрасываем флаг при ошибке
      
      toast({
        title: "Ошибка открытия кейса",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDirectResult = (reward: any) => {
    console.log('🎯 Handling direct result:', reward);
    
    if (reward?.type === 'skin') {
      console.log('🎨 Setting won skin:', reward.name);
      setWonSkin(reward);
    } else if (reward?.type === 'coin_reward') {
      console.log('🪙 Setting won coins:', reward.amount);
      setWonCoins(reward.amount || 0);
    } else {
      console.warn('⚠️ Unknown reward type:', reward);
    }
    
    setAnimationPhase('complete');
    setTimeout(() => {
      if (componentMountedRef.current) {
        setIsComplete(true);
        isProcessingRef.current = false;
      }
    }, 1000);
  };

  const handleRouletteComplete = (winnerItem: RouletteItem) => {
    console.log('🏆 Roulette complete, winner:', winnerItem);
    
    if (!componentMountedRef.current) {
      console.log('⚠️ Component unmounted, skipping roulette completion');
      return;
    }
    
    if (winnerItem.type === 'skin') {
      console.log('🎨 Winner is skin:', winnerItem.name);
      setWonSkin(winnerItem);
    } else if (winnerItem.type === 'coin_reward') {
      console.log('🪙 Winner is coins:', winnerItem.amount);
      setWonCoins(winnerItem.amount || 0);
    }
    
    setAnimationPhase('complete');
    setTimeout(() => {
      if (componentMountedRef.current) {
        setIsComplete(true);
        isProcessingRef.current = false;
      }
    }, 1000);
  };

  const addToInventory = async () => {
    setIsProcessing(true);
    try {
      console.log('📦 Skin already added to inventory by RPC function');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Inventory action completed');
    } catch (error) {
      console.error('❌ Error in addToInventory:', error);
      setError('Не удалось добавить в инвентарь');
    } finally {
      setIsProcessing(false);
    }
  };

  const sellDirectly = async () => {
    setIsProcessing(true);
    try {
      if (wonSkin) {
        console.log('💰 Selling skin directly for', wonSkin.price, 'coins');
        const newCoins = currentUser.coins + wonSkin.price;
        onCoinsUpdate(newCoins);
        console.log('✅ Direct sale completed, new balance:', newCoins);
        
        toast({
          title: "Скин продан!",
          description: `Получено ${wonSkin.price} монет`,
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('❌ Error in sellDirectly:', error);
      setError('Не удалось продать скин');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
    };
  }, []);

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
