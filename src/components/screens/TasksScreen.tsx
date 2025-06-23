
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Coins, ExternalLink } from "lucide-react";
import LazyImage from "@/components/ui/LazyImage";

interface TasksScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const TasksScreen = ({ currentUser, onCoinsUpdate }: TasksScreenProps) => {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  const handleTaskClick = async (task: any) => {
    try {
      if (task.task_url && task.task_url.startsWith('http')) {
        window.open(task.task_url, '_blank');
      }
      
      const newCoins = currentUser.coins + task.reward_coins;
      await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);
      onCoinsUpdate(newCoins);
    } catch (error) {
      console.error('Task completion error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Загрузка заданий...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6">Задания</h1>
      
      <div className="space-y-3">
        {tasks?.map((task) => (
          <div 
            key={task.id}
            onClick={() => handleTaskClick(task)}
            className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20 cursor-pointer hover:border-orange-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0">
                {task.image_url && (
                  <div className="w-12 h-12 mr-4 flex-shrink-0">
                    <LazyImage
                      src={task.image_url}
                      alt={task.title}
                      className="w-full h-full object-cover rounded-lg border border-gray-600/30"
                      timeout={3000}
                      fallback={
                        <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600/30">
                          <Gift className="w-6 h-6 text-gray-400" />
                        </div>
                      }
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold truncate">{task.title}</h4>
                  <p className="text-gray-400 text-sm truncate">{task.description}</p>
                </div>
              </div>
              <div className="text-right ml-2">
                <div className="flex items-center space-x-1 text-orange-400 font-bold">
                  <span>+{task.reward_coins}</span>
                  <Coins className="w-4 h-4" />
                </div>
                <p className="text-gray-400 text-xs">монет</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksScreen;
