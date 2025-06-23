
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useInventoryData = (userId: string) => {
  return useQuery({
    queryKey: ['user-inventory', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          id,
          obtained_at,
          is_sold,
          sold_at,
          sold_price,
          skins!inner (
            id,
            name,
            weapon_type,
            rarity,
            price,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('obtained_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch inventory: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!userId,
  });
};
