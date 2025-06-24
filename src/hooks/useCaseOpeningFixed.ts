import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { SafeSellCaseRewardResponse } from '@/types/rpc';

export interface CaseOpeningResult {
  success: boolean;
  reward?: any;
  inventory_id?: string;
  new_balance?: number;
  roulette_items?: any[];
  winner_position?: number;
  error?: string;
  required?: number;
  current?: number;
  next_available?: string;
}

interface UseCaseOpeningFixedProps {
  caseItem: any;
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

export const useCaseOpeningFixed = ({ 
  caseItem, 
  currentUser, 
  onCoinsUpdate 
}: UseCaseOpeningFixedProps) => {
  const [wonSkin, setWonSkin] = useState<any>(null);
  const [wonCoins, setWonCoins] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'roulette' | 'complete'>('opening');
  const [isProcessing, setIsProcessing] = useState(false);
  const [caseSkins, setCaseSkins] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rouletteData, setRouletteData] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загружаем кейс при монтировании
  useEffect(() => {
    if (caseItem?.id && currentUser?.id) {
      openCase();
    }
  }, [caseItem?.id, currentUser?.id]);

  const openCase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🎮 [CASE_OPENING_FIXED] Opening case:', caseItem?.name);

      const { data, error } = await supabase.rpc('safe_open_case', {
        p_user_id: currentUser.id,
        p_case_id: caseItem.id,
        p_skin_id: null,
        p_coin_reward_id: null,
        p_is_free: false,
        p_ad_watched: false
      });

      if (error) {
        console.error('❌ [CASE_OPENING_FIXED] RPC error:', error);
        throw new Error(error.message || 'Не удалось открыть кейс');
      }

      const result = data as unknown as CaseOpeningResult;
      console.log('✅ [CASE_OPENING_FIXED] Case opened successfully:', result);

      if (!result.success) {
        throw new Error(result.error || 'Не удалось открыть кейс');
      }

      // Устанавливаем данные рулетки
      if (result.roulette_items && result.winner_position !== undefined) {
        setRouletteData({
          items: result.roulette_items,
          winnerPosition: result.winner_position
        });
      }

      // Обновляем баланс
      if (result.new_balance !== undefined) {
        onCoinsUpdate(result.new_balance);
      }

      // Устанавливаем награду
      if (result.reward) {
        if (result.reward.type === 'coin_reward') {
          setWonCoins(result.reward.amount || 0);
        } else {
          setWonSkin(result.reward);
        }
      }

      setIsLoading(false);
      
      // Начинаем анимацию
      setTimeout(() => {
        setAnimationPhase('roulette');
      }, 1000);

    } catch (error: any) {
      console.error('💥 [CASE_OPENING_FIXED] Case opening failed:', error);
      setError(error.message || 'Неизвестная ошибка');
      setIsLoading(false);
    }
  };

  const handleRouletteComplete = useCallback(() => {
    console.log('🎯 [CASE_OPENING_FIXED] Roulette complete');
    setAnimationPhase('complete');
    setIsComplete(true);
  }, []);

  const addToInventory = async () => {
    if (!wonSkin) return;
    
    setIsProcessing(true);
    try {
      console.log('📦 [CASE_OPENING_FIXED] Adding skin to inventory');
      // Логика уже выполнена в RPC функции, просто показываем успех
      toast({
        title: "Скин добавлен в инвентарь!",
        description: `${wonSkin.name} теперь в вашем инвентаре`,
      });
      
      // Инвалидируем кэш инвентаря
      queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
    } catch (error: any) {
      console.error('❌ [CASE_OPENING_FIXED] Failed to add to inventory:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить скин в инвентарь",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sellDirectly = async () => {
    if (!wonSkin) return;
    
    setIsProcessing(true);
    try {
      console.log('💰 [CASE_OPENING_FIXED] Selling skin directly for price:', wonSkin.price);
      
      // Используем правильную RPC функцию для продажи награды из кейса
      const { data, error } = await supabase.rpc('safe_sell_case_reward', {
        p_user_id: currentUser.id,
        p_skin_id: wonSkin.id, // Используем ID скина, а не inventory_id
        p_sell_price: wonSkin.price // Используем цену скина
      });

      if (error) {
        console.error('❌ [CASE_OPENING_FIXED] RPC error:', error);
        throw new Error(error.message || 'Не удалось продать скин');
      }

      const result = data as unknown as SafeSellCaseRewardResponse;
      console.log('✅ [CASE_OPENING_FIXED] Sell result:', result);
      
      if (result.success && result.new_balance !== undefined) {
        onCoinsUpdate(result.new_balance);
        toast({
          title: "Скин продан!",
          description: `Получено ${wonSkin.price} монет`,
        });
        
        // Инвалидируем кэши
        queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
        queryClient.invalidateQueries({ queryKey: ['user-balance', currentUser.id] });
      } else {
        throw new Error(result.error || 'Не удалось продать скин');
      }
    } catch (error: any) {
      console.error('❌ [CASE_OPENING_FIXED] Failed to sell skin:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось продать скин",
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
