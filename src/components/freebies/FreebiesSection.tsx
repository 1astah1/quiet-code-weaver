
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Gift, Play, Users, Brain } from "lucide-react";

interface FreebiesSectionProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const FreebiesSection = ({ currentUser, onCoinsUpdate }: FreebiesSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: freebies } = useQuery({
    queryKey: ['freebies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freebies')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  const claimMutation = useMutation({
    mutationFn: async (freebieId: string) => {
      // Проверяем, можно ли получить бонус
      const { data: claims } = await supabase
        .from('user_freebie_claims')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('freebie_id', freebieId)
        .gte('next_available_at', new Date().toISOString());

      if (claims && claims.length > 0) {
        throw new Error('Бонус еще недоступен');
      }

      // Получаем информацию о бонусе
      const { data: freebie } = await supabase
        .from('freebies')
        .select('*')
        .eq('id', freebieId)
        .single();

      if (!freebie) throw new Error('Бонус не найден');

      // Начисляем награду
      const newCoins = currentUser.coins + freebie.reward_value;
      const { error: updateError } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Записываем факт получения бонуса
      const nextAvailable = new Date();
      nextAvailable.setHours(nextAvailable.getHours() + freebie.cooldown_hours);

      const { error: claimError } = await supabase
        .from('user_freebie_claims')
        .insert({
          user_id: currentUser.id,
          freebie_id: freebieId,
          next_available_at: nextAvailable.toISOString()
        });

      if (claimError) throw claimError;

      return { newCoins, reward: freebie.reward_value };
    },
    onSuccess: (data) => {
      onCoinsUpdate(data.newCoins);
      toast({
        title: "Бонус получен!",
        description: `+${data.reward} монет`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-freebie-claims'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getFreebieIcon = (name: string) => {
    if (name.includes('Викторина')) return <Brain className="w-5 h-5" />;
    if (name.includes('реклам')) return <Play className="w-5 h-5" />;
    if (name.includes('друг')) return <Users className="w-5 h-5" />;
    return <Gift className="w-5 h-5" />;
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white mb-4">Бесплатные бонусы</h2>
      <div className="space-y-3">
        {freebies?.map((freebie) => (
          <div
            key={freebie.id}
            className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                  {getFreebieIcon(freebie.name)}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{freebie.name}</h3>
                  <p className="text-gray-400 text-sm">{freebie.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-yellow-400 font-bold mb-1">
                  +{freebie.reward_value} монет
                </div>
                <button
                  onClick={() => claimMutation.mutate(freebie.id)}
                  disabled={claimMutation.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {claimMutation.isPending ? "..." : "Получить"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FreebiesSection;
