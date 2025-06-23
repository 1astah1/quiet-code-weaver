
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useInventoryData = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-inventory', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('📦 Fetching inventory for user:', userId);
      
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
        .eq('is_sold', false)
        .order('obtained_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching inventory:', error);
        throw error;
      }

      console.log('✅ Inventory loaded:', data?.length, 'items');
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};
