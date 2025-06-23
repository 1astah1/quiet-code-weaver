
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserInventory = (userId: string) => {
  return useQuery({
    queryKey: ['user-inventory', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          *,
          skins (
            id,
            name,
            weapon_type,
            rarity,
            price,
            image_url
          )
        `)
        .eq('user_id', userId)
        .eq('is_sold', false)
        .order('obtained_at', { ascending: false });

      if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
