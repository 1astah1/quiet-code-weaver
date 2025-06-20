
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useReviews = () => {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('is_hot', { ascending: false })
        .order('reward_coins', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут кеша для улучшения производительности
  });
};

export const useCompleteReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ reviewId, userId, currentCoins }: { 
      reviewId: string; 
      userId: string; 
      currentCoins: number;
    }) => {
      const { data: review } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();

      if (!review) throw new Error('Отзыв не найден');

      const newCoins = currentCoins + review.reward_coins;
      
      const { error } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', userId);

      if (error) throw error;

      // Помечаем отзыв как завершенный
      await supabase
        .from('reviews')
        .update({ is_completed: true, user_id: userId })
        .eq('id', reviewId);

      return { newCoins, reward: review.reward_coins };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: "Задание выполнено!",
        description: `Получено ${data.reward} монет`,
      });
      return data.newCoins;
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось выполнить задание",
        variant: "destructive",
      });
    }
  });
};
