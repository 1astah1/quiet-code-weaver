
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Search } from "lucide-react";

interface GoalCreateModalProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onClose: () => void;
}

const GoalCreateModal = ({ currentUser, onClose }: GoalCreateModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkin, setSelectedSkin] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: skins } = useQuery({
    queryKey: ['skins-for-goals', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('skins')
        .select('*')
        .order('price', { ascending: false });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    }
  });

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSkin) throw new Error('Выберите скин');

      const { error } = await supabase
        .from('user_goals')
        .insert({
          user_id: currentUser.id,
          skin_id: selectedSkin.id,
          target_price: selectedSkin.price,
          current_progress: currentUser.coins
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Цель создана!",
        description: `Цель "${selectedSkin.name}" добавлена`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-goals'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Создать цель</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск скинов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
            {skins?.map((skin) => (
              <div
                key={skin.id}
                onClick={() => setSelectedSkin(skin)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedSkin?.id === skin.id
                    ? "bg-blue-500/30 border border-blue-500"
                    : "bg-gray-700 hover:bg-gray-600 border border-transparent"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
                    {skin.image_url ? (
                      <img 
                        src={skin.image_url} 
                        alt={skin.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      <span className="text-xs">🔫</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{skin.name}</h3>
                    <p className="text-gray-400 text-sm">{skin.weapon_type}</p>
                  </div>
                  <div className="text-yellow-400 font-bold">
                    {skin.price.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedSkin && (
            <div className="bg-gray-700 rounded-lg p-3 mb-4">
              <h3 className="text-white font-semibold mb-2">Выбранная цель:</h3>
              <p className="text-gray-300">{selectedSkin.name}</p>
              <p className="text-yellow-400 font-bold">{selectedSkin.price.toLocaleString()} монет</p>
            </div>
          )}

          <button
            onClick={() => createGoalMutation.mutate()}
            disabled={!selectedSkin || createGoalMutation.isPending}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {createGoalMutation.isPending ? "Создание..." : "Создать цель"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalCreateModal;
