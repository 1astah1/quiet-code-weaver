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
        console.log('Opening case:', caseItem.name, 'Price:', caseItem.price, 'User coins:', userCoins, 'Is free:', caseItem.is_free, 'Ad watched:', isAdWatched);
        
        if (!isValidUUID(userId)) {
          throw new Error('Ошибка пользователя. Пожалуйста, перезагрузите страницу.');
        }

        // Проверяем кулдаун для бесплатного кейса
        if (caseItem.is_free && !isAdWatched) {
          const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('last_free_case_notification')
            .eq('id', userId)
            .maybeSingle();

          if (!userDataError && userData?.last_free_case_notification) {
            const lastOpen = new Date(userData.last_free_case_notification);
            const now = new Date();
            const timeDiff = now.getTime() - lastOpen.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff < 2) {
              const remainingTime = Math.ceil(2 - hoursDiff);
              throw new Error(`Бесплатный кейс можно открыть через ${remainingTime} ч.`);
            }
          }
        }

        // Проверяем достаточность монет
        if (!caseItem.is_free && !isAdWatched && caseItem.price > userCoins) {
          throw new Error(`Недостаточно монет. Нужно ${caseItem.price}, у вас ${userCoins}`);
        }

        // Проверяем/создаем пользователя
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id, coins')
          .eq('id', userId)
          .maybeSingle();

        let actualCoins = userCoins;

        if (userCheckError && userCheckError.code !== 'PGRST116') {
          console.error('Error checking user:', userCheckError);
          throw new Error('Ошибка проверки пользователя');
        }

        if (!existingUser) {
          console.log('Creating new user for case opening');
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              username: 'user',
              coins: userCoins
            });

          if (createError) {
            console.error('Error creating user:', createError);
            throw new Error('Не удалось создать пользователя');
          }
        } else {
          actualCoins = existingUser.coins;
        }

        // Получаем скины кейса
        const { data: caseSkins, error: skinsError } = await supabase
          .from('case_skins')
          .select(`
            probability,
            never_drop,
            custom_probability,
            skins (*)
          `)
          .eq('case_id', caseItem.id)
          .eq('never_drop', false);

        if (skinsError) {
          console.error('Error getting case skins:', skinsError);
          throw new Error('Не удалось получить содержимое кейса');
        }
        
        if (!caseSkins || caseSkins.length === 0) {
          throw new Error('В кейсе нет доступных скинов');
        }

        console.log('Case skins loaded:', caseSkins.length);

        // Выбираем случайный скин
        const totalProbability = caseSkins.reduce((sum, item) => {
          return sum + (item.custom_probability || item.probability || 0.01);
        }, 0);
        
        let random = Math.random() * totalProbability;
        let selectedSkin = caseSkins[0];

        for (const skin of caseSkins) {
          const probability = skin.custom_probability || skin.probability || 0.01;
          random -= probability;
          if (random <= 0) {
            selectedSkin = skin;
            break;
          }
        }

        console.log('Selected skin:', selectedSkin.skins.name);

        let newCoins = actualCoins;
        let updateData: any = {};

        // Списываем монеты если кейс платный и не просмотрена реклама
        if (!caseItem.is_free && !isAdWatched) {
          if (actualCoins < caseItem.price) {
            throw new Error(`Недостаточно монет. Нужно ${caseItem.price}, у вас ${actualCoins}`);
          }
          
          newCoins = actualCoins - caseItem.price;
          updateData.coins = newCoins;
        }

        // Обновляем время последнего открытия бесплатного кейса
        if (caseItem.is_free) {
          updateData.last_free_case_notification = new Date().toISOString();
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);
          
          if (updateError) {
            console.error('Error updating user:', updateError);
            throw new Error('Не удалось обновить данные пользователя');
          }
        }

        // Добавляем скин в инвентарь
        const { error: inventoryError } = await supabase
          .from('user_inventory')
          .insert({
            id: generateUUID(),
            user_id: userId,
            skin_id: selectedSkin.skins.id,
            obtained_at: new Date().toISOString(),
            is_sold: false
          });
        
        if (inventoryError) {
          console.error('Error adding to inventory:', inventoryError);
          // Откатываем изменения пользователя
          if (Object.keys(updateData).length > 0) {
            await supabase
              .from('users')
              .update({ coins: actualCoins })
              .eq('id', userId);
          }
          throw new Error('Не удалось добавить скин в инвентарь');
        }

        // Записываем в историю выигрышей
        try {
          await supabase
            .from('recent_wins')
            .insert({
              id: generateUUID(),
              user_id: userId,
              skin_id: selectedSkin.skins.id,
              case_id: caseItem.id,
              won_at: new Date().toISOString()
            });
        } catch (error) {
          console.error('Error adding to recent wins (non-critical):', error);
        }

        console.log('Case opened successfully');
        return { selectedSkin: selectedSkin.skins, newCoins };
      } catch (error) {
        console.error('Open case error:', error);
        throw error;
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-inventory', userId] });
      queryClient.invalidateQueries({ queryKey: ['recent-wins'] });
    },
    onError: (error: any) => {
      console.error('Open case mutation error:', error);
      toast({
        title: "Ошибка открытия кейса",
        description: error.message || "Не удалось открыть кейс",
        variant: "destructive",
      });
    },
    retry: 1
  });
};
