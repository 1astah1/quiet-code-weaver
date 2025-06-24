import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const [isComplete, setIsComplete] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'roulette' | 'complete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rouletteData, setRouletteData] = useState<{
    items: RouletteItem[];
    winnerPosition: number;
  } | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Загружаем скины кейса для рулетки
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

  // Функция для открытия кейса (упрощенная логика)
  const openCaseSafely = useCallback(async () => {
    if (isProcessing || !caseItem || !currentUser) {
      console.log('🚫 [CASE_OPENING] Already processing or missing data');
      return;
    }

    console.log('🎯 [CASE_OPENING] Starting case opening');
    
    setIsProcessing(true);
    setError(null);
    setAnimationPhase('opening');

    try {
      // Вызываем RPC функцию для открытия кейса
      const { data, error } = await supabase.rpc('safe_open_case', {
        p_user_id: currentUser.id,
        p_case_id: caseItem.id,
        p_skin_id: undefined,
        p_coin_reward_id: undefined,
        p_is_free: caseItem.is_free || false
      });

      if (error) {
        console.error('❌ [CASE_OPENING] RPC error:', error);
        throw new Error(error.message || 'Не удалось открыть кейс');
      }

      const response = data as unknown as CaseOpeningResponse;
      console.log('✅ [CASE_OPENING] Response received:', response);

      if (!response.success) {
        throw new Error(response.error || 'Не удалось открыть кейс');
      }

      // Обновляем баланс
      if (response.new_balance !== undefined) {
        onCoinsUpdate(response.new_balance);
        console.log('💰 [CASE_OPENING] Balance updated:', response.new_balance);
      }

      // Если есть данные рулетки, показываем анимацию
      if (response.roulette_items && response.winner_position !== undefined) {
        console.log('🎰 [CASE_OPENING] Setting up roulette animation');
        
        setRouletteData({
          items: response.roulette_items,
          winnerPosition: response.winner_position
        });
        
        // Анимация открытия (1 секунда), затем рулетка
        setTimeout(() => {
          setAnimationPhase('roulette');
        }, 1000);
      } else {
        // Если нет рулетки, сразу показываем результат
        setAnimationPhase('complete');
        setTimeout(() => {
          setIsComplete(true);
        }, 1000);
      }

    } catch (error: any) {
      console.error('💥 [CASE_OPENING] Error:', error);
      setError(error.message || 'Произошла ошибка при открытии кейса');
      setAnimationPhase(null);
      
      toast({
        title: "Ошибка открытия кейса",
        description: error.message || "Не удалось открыть кейс",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [caseItem, currentUser, isProcessing, onCoinsUpdate, toast]);

  // Обработка завершения анимации рулетки
  const handleRouletteComplete = useCallback(() => {
    console.log('🎊 [CASE_OPENING] Roulette animation complete');
    if (rouletteData && rouletteData.items && typeof rouletteData.winnerPosition === 'number') {
      const winnerItem = rouletteData.items[rouletteData.winnerPosition];
      if (winnerItem?.type === 'skin') {
        setWonSkin(winnerItem);
        setWonCoins(0);
      } else if (winnerItem?.type === 'coin_reward') {
        setWonSkin(null);
        setWonCoins(winnerItem.amount || 0);
      }
    }
    setAnimationPhase('complete');
    setTimeout(() => {
      setIsComplete(true);
    }, 1000);
  }, [rouletteData]);

  // Добавление в инвентарь
  const addToInventory = useCallback(async () => {
    if (!wonSkin || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      console.log('📦 [CASE_OPENING] Adding to inventory:', wonSkin.name);
      
      // Обновляем инвентарь
      queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
      
      toast({
        title: "Скин добавлен в инвентарь!",
        description: `${wonSkin.name} теперь в вашем инвентаре`,
      });
      
      // Закрываем модальное окно
      setAnimationPhase(null);
      setIsComplete(false);
      setWonSkin(null);
      setWonCoins(0);
      setRouletteData(null);
      
    } catch (error: any) {
      console.error('❌ [CASE_OPENING] Error adding to inventory:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить скин в инвентарь",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [wonSkin, isProcessing, queryClient, currentUser.id, toast]);

  // Продажа скина
  const sellDirectly = useCallback(async () => {
    if (!wonSkin || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      console.log('💰 [CASE_OPENING] Selling skin directly:', wonSkin.name);
      
      const { data, error } = await supabase.rpc('safe_sell_case_reward', {
        p_user_id: currentUser.id,
        p_skin_id: wonSkin.id,
        p_sell_price: wonSkin.price
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
        description: `Получено ${wonSkin.price} монет`,
      });
      
      // Обновляем инвентарь
      queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
      
      // Закрываем модальное окно
      setAnimationPhase(null);
      setIsComplete(false);
      setWonSkin(null);
      setWonCoins(0);
      setRouletteData(null);
      
    } catch (error: any) {
      console.error('❌ [CASE_OPENING] Sell error:', error);
      toast({
        title: "Ошибка продажи",
        description: error.message || "Не удалось продать скин",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [wonSkin, isProcessing, currentUser.id, onCoinsUpdate, toast, queryClient]);

  // Сброс состояния при смене кейса
  useEffect(() => {
    if (caseItem?.id) {
      console.log('🔄 [CASE_OPENING] Resetting state for case:', caseItem.name);
      setWonSkin(null);
      setWonCoins(0);
      setIsComplete(false);
      setAnimationPhase(null);
      setError(null);
      setRouletteData(null);
    }
  }, [caseItem?.id]);

  return {
    wonSkin,
    wonCoins,
    isComplete,
    animationPhase,
    isProcessing,
    error,
    isLoading,
    rouletteData,
    handleRouletteComplete,
    addToInventory,
    sellDirectly,
    openCaseSafely
  };
};
