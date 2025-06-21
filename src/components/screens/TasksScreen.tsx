import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, CheckCircle, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DailyRewardsCalendar from "@/components/DailyRewardsCalendar";
import { useSecureTaskProgress } from "@/hooks/useSecureTaskProgress";
import OptimizedImage from "@/components/ui/OptimizedImage";

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
    <div className="min-h-screen pb-16 sm:pb-20 px-3 sm:px-4 pt-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">Задания</h1>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base">Выполняй задания и получай монеты</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {tasks?.map((task) => {
          const taskStatus = getTaskStatus(task.id);
          
          return (
            <div
              key={task.id}
              className={`bg-gradient-to-r rounded-lg p-3 sm:p-4 border transition-all ${
                taskStatus === 'claimed' 
                  ? "from-green-900/30 to-green-800/30 border-green-500/30" 
                  : taskStatus === 'completed'
                  ? "from-yellow-900/30 to-yellow-800/30 border-yellow-500/50"
                  : "from-gray-800/90 to-gray-900/90 border-orange-500/30 hover:border-orange-500/50"
              }`}
            >
              <div className="flex items-center">
                {task.image_url && (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4 flex-shrink-0">
                    <OptimizedImage
                      src={task.image_url}
                      alt={task.title}
                      className="w-full h-full object-cover rounded-lg"
                      fallback={
                        <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center">
                          <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                      }
                      onError={() => console.log('Failed to load task image for:', task.title)}
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className={`font-semibold text-sm sm:text-base truncate ${
                      taskStatus === 'claimed' ? 'text-green-400' : 'text-white'
                    }`}>
                      {task.title}
                    </h3>
                    {taskStatus === 'claimed' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />}
                  </div>
                  <p className={`text-xs sm:text-sm mb-3 line-clamp-2 ${
                    taskStatus === 'claimed' ? 'text-green-300' : 'text-gray-400'
                  }`}>
                    {task.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center space-x-1 sm:space-x-2 ${
                      taskStatus === 'claimed' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium text-xs sm:text-sm">+{task.reward_coins} монет</span>
                    </div>
                    
                    {taskStatus === 'available' && (
                      <button
                        onClick={() => handleTaskClick(task)}
                        disabled={completeTask.isPending}
                        className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-white"
                      >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">
                          {completeTask.isPending ? "Выполнение..." : "Выполнить"}
                        </span>
                      </button>
                    )}

                    {taskStatus === 'completed' && (
                      <button
                        onClick={() => handleClaimReward(task)}
                        disabled={claimReward.isPending}
                        className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 text-white animate-pulse"
                      >
                        <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">
                          {claimReward.isPending ? "Получение..." : "Забрать"}
                        </span>
                      </button>
                    )}

                    {taskStatus === 'claimed' && (
                      <div className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm bg-green-600 text-white cursor-not-allowed">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Выполнено</span>
                      </div>
                    )}
                  </div>
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
