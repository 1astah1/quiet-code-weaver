
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { generateUUID } from "@/utils/uuid";

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
  const [isOpening, setIsOpening] = useState(false);
  const [wonSkin, setWonSkin] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'revealing' | 'complete'>('opening');
  const [isProcessing, setIsProcessing] = useState(false);
  const [caseSkins, setCaseSkins] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openCase = async () => {
    if (isOpening) return;
    
    setIsOpening(true);
    setAnimationPhase('opening');

    try {
      console.log('Starting case opening for:', caseItem?.name);

      if (!currentUser?.id) {
        throw new Error('Пользователь не найден');
      }

      const { data: fetchedCaseSkins, error: caseSkinsError } = await supabase
        .from('case_skins')
        .select(`
          probability,
          custom_probability,
          never_drop,
          skins (*)
        `)
        .eq('case_id', caseItem.id)
        .eq('never_drop', false);

      if (caseSkinsError) {
        console.error('Error fetching case skins:', caseSkinsError);
        throw new Error('Не удалось загрузить содержимое кейса');
      }

      if (!fetchedCaseSkins || fetchedCaseSkins.length === 0) {
        throw new Error('В кейсе нет доступных предметов');
      }

      setCaseSkins(fetchedCaseSkins);
      console.log('Case skins loaded:', fetchedCaseSkins.length);

      const totalProbability = fetchedCaseSkins.reduce((sum, item) => {
        return sum + (item.custom_probability || item.probability || 0.01);
      }, 0);
      
      let random = Math.random() * totalProbability;
      let selectedSkin = fetchedCaseSkins[0];

      for (const skin of fetchedCaseSkins) {
        const probability = skin.custom_probability || skin.probability || 0.01;
        random -= probability;
        if (random <= 0) {
          selectedSkin = skin;
          break;
        }
      }

      if (!selectedSkin?.skins) {
        throw new Error('Не удалось выбрать скин');
      }

      console.log('Selected skin:', selectedSkin.skins.name);

      // Увеличенное время для новой анимации открытия (3 секунды)
      setTimeout(() => {
        setAnimationPhase('revealing');
        setWonSkin(selectedSkin.skins);
      }, 3000);
      
      // Общее время анимации увеличено до 8 секунд
      setTimeout(() => {
        setAnimationPhase('complete');
        setIsComplete(true);
        setIsOpening(false);

        toast({
          title: "🎉 Поздравляем!",
          description: `Вы выиграли ${selectedSkin.skins.name}!`,
        });
      }, 8000);

    } catch (error) {
      console.error('Case opening error:', error);
      setIsOpening(false);
      setAnimationPhase('opening');
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось открыть кейс",
        variant: "destructive",
      });
    }
  };

  const addToInventory = async () => {
    if (!wonSkin || isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('Adding to inventory:', wonSkin.name);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, coins')
        .eq('id', currentUser.id)
        .single();

      if (userError) {
        console.error('User check error:', userError);
        throw new Error('Пользователь не найден');
      }

      // Добавляем в инвентарь
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert({
          id: generateUUID(),
          user_id: currentUser.id,
          skin_id: wonSkin.id,
          obtained_at: new Date().toISOString(),
          is_sold: false
        });

      if (inventoryError) {
        console.error('Inventory error:', inventoryError);
        throw new Error('Не удалось добавить в инвентарь');
      }

      // Добавляем в недавние выигрыши
      try {
        await supabase
          .from('recent_wins')
          .insert({
            id: generateUUID(),
            user_id: currentUser.id,
            skin_id: wonSkin.id,
            case_id: caseItem.id,
            won_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Recent win error (non-critical):', error);
      }

      // Списываем монеты только для платных кейсов
      if (!caseItem.is_free) {
        const newCoins = userData.coins - caseItem.price;
        if (newCoins < 0) {
          throw new Error('Недостаточно монет');
        }

        const { error: coinsError } = await supabase
          .from('users')
          .update({ coins: newCoins })
          .eq('id', currentUser.id);

        if (coinsError) {
          console.error('Coins update error:', coinsError);
          throw new Error('Не удалось списать монеты');
        }
        
        onCoinsUpdate(newCoins);
      }

      // ВАЖНО: Инвалидируем кеш инвентаря
      await queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
      
      // Принудительно обновляем данные
      await queryClient.refetchQueries({ queryKey: ['user-inventory', currentUser.id] });

      console.log('Successfully added to inventory and invalidated cache');

      toast({
        title: "Скин добавлен в инвентарь!",
        description: `${wonSkin.name} теперь в ваших выигрышах`,
      });

    } catch (error) {
      console.error('Add to inventory error:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось добавить скин в инвентарь",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sellDirectly = async () => {
    if (!wonSkin || isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('Selling directly:', wonSkin.name);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, coins')
        .eq('id', currentUser.id)
        .single();

      if (userError) {
        console.error('User check error:', userError);
        throw new Error('Пользователь не найден');
      }

      const sellPrice = wonSkin.price || 0;
      let newCoins = userData.coins + sellPrice;
      
      // Списываем монеты за кейс только для платных кейсов
      if (!caseItem.is_free) {
        newCoins -= caseItem.price;
        if (newCoins < 0) {
          throw new Error('Недостаточно монет для покупки кейса');
        }
      }

      const { error: coinsError } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);

      if (coinsError) {
        console.error('Coins update error:', coinsError);
        throw new Error('Не удалось обновить баланс');
      }

      // Добавляем в недавние выигрыши
      try {
        await supabase
          .from('recent_wins')
          .insert({
            id: generateUUID(),
            user_id: currentUser.id,
            skin_id: wonSkin.id,
            case_id: caseItem.id,
            won_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Recent win error (non-critical):', error);
      }

      onCoinsUpdate(newCoins);

      toast({
        title: "Скин продан!",
        description: `Получено ${sellPrice} монет за ${wonSkin.name}`,
      });

    } catch (error) {
      console.error('Sell directly error:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось продать скин",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!caseItem || !currentUser) {
      console.error('Missing required props');
      return;
    }
    
    openCase();
  }, [caseItem?.id, currentUser?.id]);

  return {
    isOpening,
    wonSkin,
    isComplete,
    animationPhase,
    isProcessing,
    caseSkins,
    addToInventory,
    sellDirectly
  };
};
