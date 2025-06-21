
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Clock, CheckCircle, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TasksScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

interface Task {
  id: string;
  title: string;
  description: string;
  reward_coins: number;
  task_url: string;
  is_active: boolean;
  image_url?: string;
}

const TasksScreen = ({ currentUser, onCoinsUpdate }: TasksScreenProps) => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as Task[];
    }
  });

  const handleTaskClick = async (task: Task) => {
    if (completedTasks.includes(task.id)) return;

    setCompletedTasks(prev => [...prev, task.id]);

    try {
      const newCoins = currentUser.coins + task.reward_coins;
      const { error } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', currentUser.id);

      if (error) throw error;

      onCoinsUpdate(newCoins);

      toast({
        title: "Задание выполнено!",
        description: `Получено ${task.reward_coins} монет`,
      });

      if (task.task_url && !task.task_url.startsWith('#')) {
        window.open(task.task_url, '_blank');
      }
    } catch (error) {
      console.error('Task completion error:', error);
      setCompletedTasks(prev => prev.filter(id => id !== task.id));
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить задание",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
        <div className="animate-pulse space-y-3 sm:space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-lg h-20 sm:h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">Задания</h1>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base">Выполняй задания и получай монеты</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {tasks?.map((task) => {
          const isCompleted = completedTasks.includes(task.id);
          
          return (
            <div
              key={task.id}
              className={`bg-gradient-to-r from-gray-800/90 to-gray-900/90 rounded-lg p-3 sm:p-4 border transition-all ${
                isCompleted 
                  ? "border-green-500/50 bg-green-900/20" 
                  : "border-orange-500/30 hover:border-orange-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                {task.image_url && (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4 flex-shrink-0">
                    <img
                      src={task.image_url}
                      alt={task.title}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-white font-semibold text-sm sm:text-base truncate">{task.title}</h3>
                    {isCompleted && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />}
                  </div>
                  <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 sm:space-x-2 text-yellow-400">
                      <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium text-xs sm:text-sm">+{task.reward_coins} монет</span>
                    </div>
                    
                    <button
                      onClick={() => handleTaskClick(task)}
                      disabled={isCompleted}
                      className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                        isCompleted
                          ? "bg-green-600 text-white cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Выполнено</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Выполнить</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Tasks Section - будет переработана в следующем обновлении */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Ежедневные задания</h2>
        <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 rounded-lg p-3 sm:p-4 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm sm:text-base">Ежедневный вход</h3>
                <p className="text-gray-400 text-xs sm:text-sm truncate">Заходи каждый день и получай бонусы</p>
              </div>
            </div>
            <div className="text-yellow-400 font-bold text-xs sm:text-sm ml-2 flex-shrink-0">+25 монет</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksScreen;
