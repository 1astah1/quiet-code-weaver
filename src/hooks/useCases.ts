
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
  likes_count: number;
}

export interface CaseSkin {
  probability: number;
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
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('price');
      if (error) throw error;
      return data as Case[];
    }
  });
};

export const useCaseSkins = (caseId: string | null) => {
  return useQuery({
    queryKey: ['case-skins', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from('case_skins')
        .select(`
          probability,
          skins (*)
        `)
        .eq('case_id', caseId);
      if (error) throw error;
      return data as CaseSkin[];
    },
    enabled: !!caseId
  });
};

export const useUserFavorites = (userId: string) => {
  return useQuery({
    queryKey: ['user-favorites', userId],
    queryFn: async () => {
      if (!isValidUUID(userId)) {
        return [];
      }
      const { data, error } = await supabase
        .from('user_favorites')
        .select('case_id')
        .eq('user_id', userId);
      if (error) {
        console.error('Error loading favorites:', error);
        return [];
      }
      return data?.map(f => f.case_id) || [];
    },
    enabled: !!userId && isValidUUID(userId)
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, caseId, isFavorite }: { userId: string; caseId: string; isFavorite: boolean }) => {
      try {
        console.log('Toggling favorite:', { userId, caseId, isFavorite });
        
        // Проверяем валидность UUID
        if (!isValidUUID(userId) || !isValidUUID(caseId)) {
          throw new Error('Ошибка идентификации. Пожалуйста, перезагрузите страницу.');
        }

        // Проверяем существование пользователя или создаем его
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();

        if (userCheckError && userCheckError.code === 'PGRST116') {
          // Создаем пользователя если не существует
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              username: 'user',
              coins: 0
            });

          if (createError) {
            console.error('Error creating user:', createError);
            throw new Error('Не удалось создать пользователя');
          }
        } else if (userCheckError) {
          console.error('Error checking user:', userCheckError);
          throw new Error('Ошибка проверки пользователя');
        }
        
        if (isFavorite) {
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
        
        console.log('Favorite toggled successfully');
      } catch (error) {
        console.error('Toggle favorite error:', error);
        throw error;
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites', userId] });
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
        
        // Проверяем валидность UUID
        if (!isValidUUID(userId)) {
          throw new Error('Ошибка пользователя. Пожалуйста, перезагрузите страницу.');
        }

        // Проверяем возможность открытия
        if (!caseItem.is_free && !isAdWatched && caseItem.price > userCoins) {
          throw new Error(`Недостаточно монет. Нужно ${caseItem.price}, у вас ${userCoins}`);
        }

        // Проверяем существование пользователя
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id, coins')
          .eq('id', userId)
          .single();

        let actualCoins = userCoins;

        if (userCheckError && userCheckError.code === 'PGRST116') {
          // Создаем пользователя если не существует
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
        } else if (userCheckError) {
          console.error('Error checking user:', userCheckError);
          throw new Error('Ошибка проверки пользователя');
        } else {
          actualCoins = existingUser.coins;
        }

        // Получаем скины кейса
        const { data: caseSkins, error: skinsError } = await supabase
          .from('case_skins')
          .select(`
            probability,
            skins (*)
          `)
          .eq('case_id', caseItem.id);

        if (skinsError) {
          console.error('Error getting case skins:', skinsError);
          throw new Error('Не удалось получить содержимое кейса');
        }
        
        if (!caseSkins || caseSkins.length === 0) {
          throw new Error('В кейсе нет скинов');
        }

        console.log('Case skins loaded:', caseSkins.length);

        // Выбираем случайный скин на основе вероятности
        const totalProbability = caseSkins.reduce((sum, item) => sum + item.probability, 0);
        let random = Math.random() * totalProbability;
        let selectedSkin = caseSkins[0];

        for (const skin of caseSkins) {
          random -= skin.probability;
          if (random <= 0) {
            selectedSkin = skin;
            break;
          }
        }

        console.log('Selected skin:', selectedSkin.skins.name);

        // Списываем монеты если кейс платный и не просмотрена реклама
        let newCoins = actualCoins;
        if (!caseItem.is_free && !isAdWatched) {
          if (actualCoins < caseItem.price) {
            throw new Error(`Недостаточно монет. Нужно ${caseItem.price}, у вас ${actualCoins}`);
          }
          
          newCoins = actualCoins - caseItem.price;
          console.log('Deducting coins:', caseItem.price, 'New balance:', newCoins);
          
          const { error: coinsError } = await supabase
            .from('users')
            .update({ coins: newCoins })
            .eq('id', userId);
          if (coinsError) {
            console.error('Error updating coins:', coinsError);
            throw new Error('Не удалось списать монеты');
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
          // Откатываем списание монет
          if (!caseItem.is_free && !isAdWatched) {
            await supabase
              .from('users')
              .update({ coins: actualCoins })
              .eq('id', userId);
          }
          throw new Error('Не удалось добавить скин в инвентарь');
        }

        // Записываем в историю выигрышей
        const { error: winError } = await supabase
          .from('recent_wins')
          .insert({
            id: generateUUID(),
            user_id: userId,
            skin_id: selectedSkin.skins.id,
            case_id: caseItem.id,
            won_at: new Date().toISOString()
          });
        if (winError) {
          console.error('Error adding to recent wins:', winError);
          // Не критичная ошибка, продолжаем
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
    }
  });
};
