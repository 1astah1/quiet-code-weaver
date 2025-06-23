
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCases = () => {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          case_rewards (
            id,
            reward_type,
            probability,
            never_drop,
            skins (
              id,
              name,
              weapon_type,
              rarity,
              price,
              image_url
            ),
            coin_rewards (
              id,
              amount,
              name,
              image_url
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at');

      if (error) {
        console.error('Error fetching cases:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
