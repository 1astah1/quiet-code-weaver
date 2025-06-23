import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateUUID, isValidUUID } from "@/utils/uuid";

export interface Case {
  id: string;
  name: string;
  description: string;
  price: number;
  is_free: boolean;
  image_url: string | null;
  cover_image_url?: string | null;
  likes_count: number;
  last_free_open?: string | null;
}

export interface CaseSkin {
  probability: number;
  never_drop?: boolean;
  custom_probability?: number;
  skins: {
    id: string;
    name: string;
    weapon_type: string;
    rarity: string;
    price: number;
    image_url: string | null;
  };
}

export const useCases = () => {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      try {
        console.log('Fetching cases...');
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .order('price');
        
        if (error) {
          console.error('Error fetching cases:', error);
          throw error;
        }
        
        console.log('Cases fetched successfully:', data?.length || 0);
        return (data || []) as Case[];
      } catch (error) {
        console.error('Cases query error:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 2000,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });
};

export const useCaseSkins = (caseId: string | null) => {
  return useQuery({
    queryKey: ['case-skins', caseId],
    queryFn: async () => {
      if (!caseId || !isValidUUID(caseId)) return [];
      
      try {
        console.log('Fetching case skins for case:', caseId);
        const { data, error } = await supabase
          .from('case_skins')
          .select(`
            probability,
            never_drop,
            custom_probability,
            skins (*)
          `)
          .eq('case_id', caseId);
        
        if (error) {
          console.error('Error fetching case skins:', error);
          return [];
        }
        
        console.log('Case skins fetched successfully:', data?.length || 0);
        return (data || []) as CaseSkin[];
      } catch (error) {
        console.error('Case skins query error:', error);
        return [];
      }
    },
    enabled: !!caseId && isValidUUID(caseId),
    retry: 1,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });
};

export const useUserFavorites = (userId: string | null) => {
  return useQuery({
    queryKey: ['user-favorites', userId],
    queryFn: async () => {
      if (!userId || !isValidUUID(userId)) {
        console.log('Invalid user ID for favorites:', userId);
        return [];
      }
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          console.log('No valid session for favorites');
          return [];
        }

        if (session.user.id !== userId) {
          console.log('User ID mismatch for favorites');
          return [];
        }
        
        const { data, error } = await supabase
          .from('user_favorites')
          .select('case_id')
          .eq('user_id', userId)
          .limit(50);
        
        if (error) {
          console.error('Error loading favorites:', error);
          return [];
        }
        
        return data?.map(f => f.case_id) || [];
      } catch (error) {
        console.error('Favorites query error:', error);
        return [];
      }
    },
    enabled: !!userId && isValidUUID(userId),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, caseId, isFavorite }: { userId: string; caseId: string; isFavorite: boolean }) => {
      try {
        console.log('Toggling favorite:', { userId, caseId, isFavorite });
        
        if (!isValidUUID(userId) || !isValidUUID(caseId)) {
          throw new Error('Ошибка идентификации. Пожалуйста, перезагрузите страницу.');
        }

        // Проверяем аутентификацию
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session || session.user.id !== userId) {
          throw new Error('Необходимо войти в систему');
        }

        // Проверяем/создаем пользователя
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (userCheckError && userCheckError.code !== 'PGRST116') {
          console.error('Error checking user:', userCheckError);
          throw new Error('Ошибка проверки пользователя');
        }

        if (!existingUser) {
          console.log('Creating user for favorites');
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              username: session.user.email?.split('@')[0] || 'user',
              email: session.user.email,
              coins: 1000
            });

          if (createError) {
            console.error('Error creating user:', createError);
            throw new Error('Не удалось создать пользователя');
          }
        }
        
        if (isFavorite) {
          // Удаляем из избранного
          const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('case_id', caseId);
          
          if (error) {
            console.error('Error removing favorite:', error);
            throw new Error('Не удалось убрать из избранного');
          }
        } else {
          // Проверяем, не существует ли уже такая запись
          const { data: existing } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('case_id', caseId)
            .maybeSingle();

          if (!existing) {
            // Добавляем в избранное
            const { error } = await supabase
              .from('user_favorites')
              .insert({
                id: generateUUID(),
                user_id: userId,
                case_id: caseId
              });
            
            if (error) {
              console.error('Error adding favorite:', error);
              throw new Error('Не удалось добавить в избранное');
            }
          }
        }
        
        console.log('Favorite toggled successfully');
      } catch (error) {
        console.error('Toggle favorite error:', error);
        throw error;
      }
    },
    onSuccess: (_, { userId }) => {
      // Обновляем кэш более аккуратно
      queryClient.invalidateQueries({ 
        queryKey: ['user-favorites', userId],
        exact: true 
      });
    },
    onError: (error: any) => {
      console.error('Favorite mutation error:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить избранное",
        variant: "destructive",
      });
    }
  });
};

export const useOpenCase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ caseItem, userId, userCoins, isAdWatched = false }: { 
      caseItem: Case; 
      userId: string; 
      userCoins: number;
      isAdWatched?: boolean;
    }) => {
      try {
        console.log('🎯 [CASE_OPENING] Starting case opening via RPC:', {
          caseId: caseItem.id,
          caseName: caseItem.name,
          price: caseItem.price,
          isFree: caseItem.is_free,
          userId,
          userCoins,
          isAdWatched
        });
        
        if (!isValidUUID(userId)) {
          throw new Error('Ошибка пользователя. Пожалуйста, перезагрузите страницу.');
        }

        // ИСПРАВЛЕНО: Убрана клиентская проверка баланса и списание
        // Все финансовые операции теперь происходят только на сервере через RPC
        
        // Проверяем/создаем пользователя
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id, coins, is_admin')
          .eq('id', userId)
          .maybeSingle();

        if (userCheckError && userCheckError.code !== 'PGRST116') {
          console.error('❌ [CASE_OPENING] Error checking user:', userCheckError);
          throw new Error('Ошибка проверки пользователя');
        }

        if (!existingUser) {
          console.log('👤 [CASE_OPENING] Creating new user for case opening');
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              username: 'user',
              coins: userCoins
            });

          if (createError) {
            console.error('❌ [CASE_OPENING] Error creating user:', createError);
            throw new Error('Не удалось создать пользователя');
          }
        }

        // ИСПРАВЛЕНО: Используем RPC функцию для безопасного открытия кейса
        console.log('📡 [CASE_OPENING] Calling safe_open_case RPC');
        const { data: rpcData, error: rpcError } = await supabase.rpc('safe_open_case', {
          p_user_id: userId,
          p_case_id: caseItem.id,
          p_skin_id: null,
          p_coin_reward_id: null,
          p_is_free: caseItem.is_free || false,
          p_ad_watched: isAdWatched
        });

        if (rpcError) {
          console.error('❌ [CASE_OPENING] RPC error:', rpcError);
          throw new Error(`Ошибка сервера: ${rpcError.message}`);
        }

        if (!rpcData || !rpcData.success) {
          console.error('❌ [CASE_OPENING] RPC returned failure:', rpcData);
          const errorMsg = rpcData?.error || 'Не удалось открыть кейс';
          
          if (errorMsg.includes('Insufficient funds')) {
            throw new Error(`Недостаточно монет. Нужно: ${rpcData.required}, у вас: ${rpcData.current}`);
          }
          
          throw new Error(errorMsg);
        }

        console.log('✅ [CASE_OPENING] Case opened successfully via RPC');
        
        // Возвращаем результат с сервера
        return { 
          selectedSkin: rpcData.reward,
          newCoins: rpcData.new_balance,
          rouletteItems: rpcData.roulette_items,
          winnerPosition: rpcData.winner_position
        };
        
      } catch (error) {
        console.error('💥 [CASE_OPENING] Case opening error:', error);
        throw error;
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-inventory', userId] });
      queryClient.invalidateQueries({ queryKey: ['recent-wins'] });
    },
    onError: (error: any) => {
      console.error('❌ [CASE_OPENING] Open case mutation error:', error);
      toast({
        title: "Ошибка открытия кейса",
        description: error.message || "Не удалось открыть кейс",
        variant: "destructive",
      });
    },
    retry: 1
  });
};
