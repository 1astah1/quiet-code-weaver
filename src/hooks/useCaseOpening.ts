import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useVibration } from "@/hooks/useVibration";
import { useSound } from "@/hooks/useSound";
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
  const [wonCoins, setWonCoins] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'revealing' | 'complete' | 'bonus'>('opening');
  const [isProcessing, setIsProcessing] = useState(false);
  const [caseSkins, setCaseSkins] = useState<any[]>([]);
  const [showBonusRoulette, setShowBonusRoulette] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { vibrateError } = useVibration();
  const { playCaseOpeningSound, playItemRevealSound, playRareItemSound, playCoinsEarnedSound } = useSound();

  const openCase = async () => {
    if (isOpening) return;
    
    setIsOpening(true);
    setAnimationPhase('opening');
    playCaseOpeningSound();

    try {
      console.log('Starting case opening for:', caseItem?.name);

      if (!currentUser?.id) {
        throw new Error('Пользователь не найден');
      }

      // Сначала списываем монеты для платных кейсов
      if (!caseItem.is_free) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('coins')
          .eq('id', currentUser.id)
          .single();

        if (userError) {
          console.error('User check error:', userError);
          throw new Error('Пользователь не найден');
        }

        if (userData.coins < caseItem.price) {
          throw new Error('Недостаточно монет');
        }

        const newCoins = userData.coins - caseItem.price;
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

      // Для бесплатных кейсов используем новую рулетку
      if (caseItem.is_free) {
        setTimeout(() => {
          setAnimationPhase('revealing');
        }, 3000);
      } else {
        // Для платных кейсов оставляем старую логику
        const shouldDropCoins = Math.random() < 0.3;

        if (shouldDropCoins) {
          const coinAmount = Math.floor(Math.random() * (caseItem.price * 2)) + 10;
          setWonCoins(coinAmount);
          playCoinsEarnedSound();
          
          setTimeout(() => {
            setAnimationPhase('revealing');
          }, 3000);
          
          setTimeout(() => {
            addCoinsToBalance(coinAmount);
            setAnimationPhase('complete');
            setIsComplete(true);
            setIsOpening(false);
          }, 8000);
          
        } else {
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

          const rarity = selectedSkin.skins.rarity?.toLowerCase();
          if (rarity === 'legendary' || rarity === 'mythical' || rarity === 'immortal') {
            setTimeout(() => playRareItemSound(), 3000);
          } else {
            setTimeout(() => playItemRevealSound(), 3000);
          }

          setTimeout(() => {
            setAnimationPhase('revealing');
            setWonSkin(selectedSkin.skins);
          }, 3000);
          
          setTimeout(() => {
            setAnimationPhase('complete');
            setIsComplete(true);
            setIsOpening(false);

            toast({
              title: "🎉 Поздравляем!",
              description: `Вы выиграли ${selectedSkin.skins.name}!`,
            });
          }, 8000);
        }
      }

    } catch (error) {
      console.error('Case opening error:', error);
      setIsOpening(false);
      setAnimationPhase('opening');
      
      vibrateError();
      
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось открыть кейс",
        variant: "destructive",
      });
    }
  };

  const handleFreeCaseResult = (result: { type: 'skin' | 'coins', skin?: any, coins?: number }) => {
    if (result.type === 'coins') {
      setWonCoins(result.coins!);
      // Показываем бонусную рулетку для монет
      setAnimationPhase('bonus');
      setShowBonusRoulette(true);
    } else {
      setWonSkin(result.skin);
      setAnimationPhase('complete');
      setIsComplete(true);
      setIsOpening(false);
      
      toast({
        title: "🎉 Поздравляем!",
        description: `Вы выиграли ${result.skin.name}!`,
      });
    }
  };

  const addCoinsToBalance = async (coinsAmount: number) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('coins')
        .eq('id', currentUser.id)
        .single();

      if (userError) throw userError;

      const newCoins = userData.coins + coinsAmount;
      const { error: coinsError } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);

      if (coinsError) throw coinsError;

      onCoinsUpdate(newCoins);
      
      toast({
        title: "Монеты получены!",
        description: `Получено ${coinsAmount} монет`,
      });
    } catch (error) {
      console.error('Add coins error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить монеты",
        variant: "destructive",
      });
    }
  };

  const handleBonusComplete = (multiplier: number, finalCoins: number) => {
    addCoinsToBalance(finalCoins);
    setShowBonusRoulette(false);
    setAnimationPhase('complete');
    setIsComplete(true);
    setIsOpening(false);
  };

  const handleBonusSkip = () => {
    addCoinsToBalance(wonCoins);
    setShowBonusRoulette(false);
    setAnimationPhase('complete');
    setIsComplete(true);
    setIsOpening(false);
  };

  const addToInventory = async () => {
    if (!wonSkin || isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('Adding to inventory:', wonSkin.name);

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

      await queryClient.invalidateQueries({ queryKey: ['user-inventory', currentUser.id] });
      await queryClient.refetchQueries({ queryKey: ['user-inventory', currentUser.id] });

      console.log('Successfully added to inventory and invalidated cache');

      toast({
        title: "Скин добавлен в инвентарь!",
        description: `${wonSkin.name} теперь в ваших выигрышах`,
      });

    } catch (error) {
      console.error('Add to inventory error:', error);
      vibrateError();
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
        .select('coins')
        .eq('id', currentUser.id)
        .single();

      if (userError) {
        console.error('User check error:', userError);
        throw new Error('Пользователь не найден');
      }

      const sellPrice = wonSkin.price || 0;
      const newCoins = userData.coins + sellPrice;

      const { error: coinsError } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);

      if (coinsError) {
        console.error('Coins update error:', coinsError);
        throw new Error('Не удалось обновить баланс');
      }

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
      vibrateError();
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
    wonCoins,
    isComplete,
    animationPhase,
    isProcessing,
    caseSkins,
    showBonusRoulette,
    addToInventory,
    sellDirectly,
    handleBonusComplete,
    handleBonusSkip,
    handleFreeCaseResult
  };
};
