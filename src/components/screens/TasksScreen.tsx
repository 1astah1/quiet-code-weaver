import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, CheckCircle, Gift } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DailyRewardsCalendar from "@/components/DailyRewardsCalendar";
import { useSecureTaskProgress } from "@/hooks/useSecureTaskProgress";
import LazyImage from "@/components/ui/LazyImage";

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
  const { toast } = useToast();
  const { taskProgress, completeTask, claimReward, getTaskStatus } = useSecureTaskProgress(currentUser.id);

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
    const currentStatus = getTaskStatus(task.id);
    
    if (currentStatus === 'claimed') return;

    if (currentStatus === 'available') {
      try {
        await completeTask.mutateAsync({ taskId: task.id });
        
        // Открываем ссылку если она есть
        if (task.task_url && !task.task_url.startsWith('#')) {
          window.open(task.task_url, '_blank');
        }
      } catch (error) {
        console.error('Task completion error:', error);
      }
    }
  };

  const handleClaimReward = async (task: Task) => {
    try {
      await claimReward.mutateAsync({ 
        taskId: task.id, 
        rewardCoins: task.reward_coins 
      });
      
      // Обновляем монеты в родительском компоненте
      onCoinsUpdate(currentUser.coins + task.reward_coins);
    } catch (error) {
      console.error('Reward claim error:', error);
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
    <div className="min-h-screen pb-16 sm:pb-20 px-2 sm:px-4 md:px-6 pt-2 sm:pt-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">Задания</h1>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base">Выполняй задания и получай монеты</p>
      </div>

      <div className="space-y-2 sm:space-y-4">
        {tasks?.map((task) => {
          const taskStatus = getTaskStatus(task.id);
          return (
            <div key={task.id} className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-orange-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  {task.image_url && (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mr-3 sm:mr-4 flex-shrink-0">
                      <LazyImage
                        src={task.image_url}
                        alt={task.title}
                        className="w-full h-full object-cover rounded-lg border border-gray-600/30"
                        timeout={3000}
                        fallback={
                          <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600/30">
                            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                          </div>
                        }
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm sm:text-base truncate">{task.title}</h4>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{task.description}</p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className={`flex items-center space-x-0.5 sm:space-x-1 ${taskStatus === 'claimed' ? 'text-green-400' : 'text-yellow-400'}`}> 
                    <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium text-xs sm:text-sm">+{task.reward_coins} монет</span>
                  </div>
                  {taskStatus === 'available' && (
                    <button
                      onClick={() => handleTaskClick(task)}
                      disabled={completeTask.isPending}
                      className="flex items-center space-x-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-white mt-2"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{completeTask.isPending ? "Выполнение..." : "Выполнить"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Rewards Calendar */}
      <div className="mt-6 sm:mt-8">
        <DailyRewardsCalendar 
          currentUser={currentUser}
          onCoinsUpdate={onCoinsUpdate}
        />
      </div>
    </div>
  );
};

export default TasksScreen;
