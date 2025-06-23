
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRecentWins = () => {
  return useQuery({
    queryKey: ['recent-wins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recent_wins')
        .select(`
          *,
          users (
            username
          ),
          skins (
            name,
            price,
            image_url
          ),
          coin_rewards (
            name,
            amount,
            image_url
          )
        `)
        .order('won_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching recent wins:', error);
        throw error;
      }

      return data || [];
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
    staleTime: 1000 * 15, // 15 seconds
  });
};
