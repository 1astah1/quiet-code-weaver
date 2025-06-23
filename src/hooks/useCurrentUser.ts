
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      return {
        ...userData,
        isAdmin: userData.user_roles?.some((r: any) => r.role === 'admin') || false,
        isPremium: userData.premium_until ? new Date(userData.premium_until) > new Date() : false
      };
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
