
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target, Plus } from "lucide-react";
import GoalCreateModal from "./GoalCreateModal";

interface GoalsSectionProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
}

const GoalsSection = ({ currentUser }: GoalsSectionProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: goals } = useQuery({
    queryKey: ['user-goals', currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_goals')
        .select(`
          *,
          skins (
            name,
            image_url,
            price
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('is_achieved', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Твои цели</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = Math.min((goal.current_progress / goal.target_price) * 100, 100);
            
            return (
              <div
                key={goal.id}
                className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                    {goal.skins?.image_url ? (
                      <img 
                        src={goal.skins.image_url} 
                        alt={goal.skins.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <Target className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{goal.skins?.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {goal.current_progress.toLocaleString()} / {goal.target_price.toLocaleString()} монет
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="text-center text-sm text-gray-400">
                  {progress.toFixed(1)}% выполнено
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">У вас пока нет целей</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Создать первую цель
          </button>
        </div>
      )}

      {showCreateModal && (
        <GoalCreateModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default GoalsSection;
