import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CS2RouletteItem {
  id: string;
  name: string;
  weapon_type?: string;
  rarity?: string;
  price: number;
  image_url?: string | null;
  type: 'skin';
}

export interface CS2CaseOpeningResult {
  success: boolean;
  roulette_items: CS2RouletteItem[];
  winner_position: number;
  reward: CS2RouletteItem;
  error?: string;
}

export const useCS2CaseOpening = (userId: string, caseId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CS2CaseOpeningResult | null>(null);
  const [phase, setPhase] = useState<'init' | 'anim' | 'roulette' | 'result'>('init');

  const openCase = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPhase('anim');
    setResult(null);
    try {
      const { data, error } = await supabase.rpc<CS2CaseOpeningResult, { p_user_id: string; p_case_id: string }>('cs2_open_case', {
        p_user_id: userId,
        p_case_id: caseId
      });
      const res = data as unknown as CS2CaseOpeningResult;
      if (error || !res || !res.success) {
        setError(res?.error || error?.message || 'Ошибка открытия кейса');
        setLoading(false);
        setPhase('init');
        return;
      }
      setResult(res);
      setTimeout(() => setPhase('roulette'), 1000);
    } catch (e: any) {
      setError(e.message || 'Ошибка открытия кейса');
      setPhase('init');
    } finally {
      setLoading(false);
    }
  }, [userId, caseId]);

  const finishRoulette = useCallback(() => {
    setPhase('result');
  }, []);

  return {
    loading,
    error,
    result,
    phase,
    openCase,
    finishRoulette,
  };
}; 