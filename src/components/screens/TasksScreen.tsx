
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

    // Mark as completed locally
    setCompletedTasks(prev => [...prev, task.id]);

    try {
      // Award coins
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

      // Open task URL if it's not a special action
      if (task.task_url && !task.task_url.startsWith('#')) {
        window.open(task.task_url, '_blank');
      }
    } catch (error) {
      console.error('Task completion error:', error);
      // Revert local state if server update failed
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
      <div className="min-h-screen pb-20 px-4 pt-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-lg h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Задания</h1>
        <p className="text-gray-400">Выполняй задания и получай монеты</p>
      </div>

      <div className="space-y-4">
        {tasks?.map((task) => {
          const isCompleted = completedTasks.includes(task.id);
          
          return (
            <div
              key={task.id}
              className={`bg-gradient-to-r from-gray-800/90 to-gray-900/90 rounded-lg p-4 border transition-all ${
                isCompleted 
                  ? "border-green-500/50 bg-green-900/20" 
                  : "border-orange-500/30 hover:border-orange-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-white font-semibold">{task.title}</h3>
                    {isCompleted && <CheckCircle className="w-5 h-5 text-green-400" />}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <Gift className="w-4 h-4" />
                      <span className="font-medium">+{task.reward_coins} монет</span>
                    </div>
                    
                    <button
                      onClick={() => handleTaskClick(task)}
                      disabled={isCompleted}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isCompleted
                          ? "bg-green-600 text-white cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Выполнено</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          <span>Выполнить</span>
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

      {/* Daily Tasks Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Ежедневные задания</h2>
        <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-white font-semibold">Ежедневный вход</h3>
                <p className="text-gray-400 text-sm">Заходи каждый день и получай бонусы</p>
              </div>
            </div>
            <div className="text-yellow-400 font-bold">+25 монет</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksScreen;
