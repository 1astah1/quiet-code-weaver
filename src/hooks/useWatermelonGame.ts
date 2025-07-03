import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WatermelonGameStatus {
  hearts: number;
  coins: number;
  next_regen: string;
  next_ad: string;
  ad_available: boolean;
}

export interface WatermelonGameSession {
  session_id: string;
  success: boolean;
  error?: string;
}

export function useWatermelonGame() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получение статуса игры
  const getGameStatus = useCallback(async (): Promise<WatermelonGameStatus | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc('get_watermelon_game_status');
      
      if (rpcError) {
        console.error('Error getting game status:', rpcError);
        setError(rpcError.message);
        return null;
      }

      return data as WatermelonGameStatus;
    } catch (err) {
      console.error('Error getting game status:', err);
      setError('Failed to get game status');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Начало игры
  const startGame = useCallback(async (): Promise<WatermelonGameSession | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc('start_watermelon_game');
      
      if (rpcError) {
        console.error('Error starting game:', rpcError);
        setError(rpcError.message);
        return null;
      }

      return data as WatermelonGameSession;
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Завершение игры
  const endGame = useCallback(async (sessionId: string, coinsEarned: number): Promise<{ success: boolean; coins: number } | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc('end_watermelon_game', {
        p_session_id: sessionId,
        p_coins_earned: coinsEarned
      });
      
      if (rpcError) {
        console.error('Error ending game:', rpcError);
        setError(rpcError.message);
        return null;
      }

      return data as { success: boolean; coins: number };
    } catch (err) {
      console.error('Error ending game:', err);
      setError('Failed to end game');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Восстановление жизни за рекламу
  const restoreHeartAd = useCallback(async (): Promise<{ success: boolean; hearts: number } | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc('restore_watermelon_heart_ad');
      
      if (rpcError) {
        console.error('Error restoring heart:', rpcError);
        setError(rpcError.message);
        return null;
      }

      return data as { success: boolean; hearts: number };
    } catch (err) {
      console.error('Error restoring heart:', err);
      setError('Failed to restore heart');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getGameStatus,
    startGame,
    endGame,
    restoreHeartAd,
  };
} 