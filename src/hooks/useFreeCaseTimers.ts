import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FreeCaseTimerInfo {
  caseId: string;
  lastOpenedAt: string | null;
}

export const useFreeCaseTimers = (userId: string) => {
  return useQuery({
    queryKey: ['free-case-timers', userId],
    queryFn: async () => {
      if (!userId) return {};
      const { data, error } = await supabase
        .from('user_free_case_openings')
        .select('case_id, opened_at')
        .eq('user_id', userId);
      if (error) throw error;
      const timers: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        timers[row.case_id] = row.opened_at;
      });
      return timers;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}; 