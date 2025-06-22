
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateInput } from "@/utils/security";
import { useVibration } from './useVibration';

export const useCaseOpening = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [wonSkin, setWonSkin] = useState<any | null>(null);
  const { toast } = useToast();
  const { vibrate, patterns } = useVibration();

  const openCase = async (caseId: string, isFreeCase = false) => {
    const userId = 'test-user-1'; // Моковый пользователь

    if (!userId) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, войдите, чтобы открыть кейс.",
        variant: "destructive",
      });
      return;
    }

    if (!caseId) {
      toast({
        title: "Ошибка",
        description: "Неверный ID кейса.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setWonSkin(null);

    try {
      // Вибрация при нажатии на открытие кейса
      vibrate(patterns.light);
      
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError) {
        throw caseError;
      }

      if (!caseData) {
        throw new Error('Кейс не найден');
      }

      const { data: skinsData, error: skinsError } = await supabase
        .from('case_skins')
        .select('skin_id, skins(*)')
        .eq('case_id', caseId);

      if (skinsError) {
        throw skinsError;
      }

      if (!skinsData || skinsData.length === 0) {
        throw new Error('В этом кейсе нет скинов');
      }

      // Выбор скина на основе вероятности
      const randomNumber = Math.random();
      let cumulativeProbability = 0;
      let selectedSkin = null;

      for (const skin of skinsData) {
        cumulativeProbability += (skin.skins?.probability || 0) / 100;
        if (randomNumber <= cumulativeProbability) {
          selectedSkin = skin.skins;
          break;
        }
      }

      if (!selectedSkin) {
        // Если ни один скин не выбран, выбираем первый попавшийся
        selectedSkin = skinsData[0].skins;
      }
      
      const { data, error } = await supabase.rpc('safe_open_case', {
        p_user_id: userId,
        p_case_id: caseId,
        p_skin_id: selectedSkin.id,
        p_is_free: isFreeCase
      });

      if (error) throw error;

      setWonSkin(selectedSkin);
      setIsLoading(false);
      
      // Успешная вибрация при получении результата
      vibrate(patterns.success);
      
      toast({
        title: "Кейс открыт!",
        description: `Поздравляем, вы получили ${selectedSkin.name}!`,
      });
    } catch (error: any) {
      // Вибрация ошибки
      vibrate(patterns.error);
      
      setIsLoading(false);
      console.error("Ошибка открытия кейса:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось открыть кейс.",
        variant: "destructive",
      });
    }
  };

  return {
    openCase,
    isLoading,
    wonSkin,
  };
};
