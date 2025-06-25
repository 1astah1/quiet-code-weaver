import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CS2RouletteItem {
  id: string;
  name: string;
  weapon_type?: string;
  rarity?: string;
  price: number;
  image_url?: string | null;
  type: 'skin';
  user_inventory_id?: string;
}

export interface CS2CaseOpeningResult {
  success: boolean;
  new_balance: number;
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
  const hasOpened = useRef(false);

  const openCase = useCallback(async () => {
    if (hasOpened.current) return;
    hasOpened.current = true;

    setLoading(true);
    setError(null);
    setPhase('anim');
    setResult(null);
    try {
      // @ts-ignore
      const { data, error } = await supabase.rpc('cs2_open_case', {
        p_user_id: userId,
        p_case_id: caseId
      });
      let res = data as unknown as CS2CaseOpeningResult & { inventory_id?: string };
      if (error || !res || !res.success) {
        setError(res?.error || error?.message || 'Ошибка открытия кейса');
        setLoading(false);
        setPhase('init');
        return;
      }
      if (res.reward && !res.reward.user_inventory_id && (res as any).inventory_id) {
        res.reward.user_inventory_id = (res as any).inventory_id;
      }
      setResult(res);
      setTimeout(() => setPhase('roulette'), 1000);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ошибка открытия кейса';
      setError(message);
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