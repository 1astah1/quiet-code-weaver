import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, CheckCircle, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DailyRewardsCalendar from "@/components/DailyRewardsCalendar";
import { useTaskProgress } from "@/hooks/useTaskProgress";
import { useEnhancedSecurity } from "@/hooks/useEnhancedSecurity";
import LazyImage from "@/components/ui/LazyImage";

interface TasksScreenFixedProps {
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

const TasksScreenFixed = ({ currentUser, onCoinsUpdate }: TasksScreenFixedProps) => {
  const { toast } = useToast();
  const { taskProgress, completeTask, claimReward, getTaskStatus } = useTaskProgress(currentUser.id);
  const { checkRateLimit, validateInput, sanitizeString } = useEnhancedSecurity(currentUser.id);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      console.log('📋 Loading tasks...');
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('id');
      
      if (error) {
        console.error('❌ Error loading tasks:', error);
        throw error;
      }
      
      console.log('✅ Tasks loaded:', data.length);
      return data as Task[];
    }
  });

  const handleTaskClick = async (task: Task) => {
    try {
      console.log('🎯 Task clicked:', task.title);
      
      // Валидация входных данных
      if (!validateInput(task.id, 'uuid')) {
        console.error('❌ Invalid task ID');
        toast({
          title: "Ошибка",
          description: "Некорректный ID задания",
          variant: "destructive"
        });
        return;
      }

      // Проверка rate limit
      const canProceed = await checkRateLimit('complete_task', 5, 10);
      if (!canProceed) {
        toast({
          title: "Слишком много попыток",
          description: "Подождите перед выполнением следующего задания",
          variant: "destructive"
        });
        return;
      }

      const currentStatus = getTaskStatus(task.id);
      
      if (currentStatus === 'claimed') {
        console.log('⚠️ Task already claimed');
        return;
      }

      if (currentStatus === 'available') {
        console.log('🚀 Completing task:', task.title);
        await completeTask.mutateAsync({ taskId: task.id });
        
        // Открываем ссылку если она есть и валидна
        if (task.task_url && 
            !task.task_url.startsWith('#') && 
            (task.task_url.startsWith('http://') || task.task_url.startsWith('https://'))) {
          
          const sanitizedUrl = sanitizeString(task.task_url);
          console.log('🔗 Opening task URL:', sanitizedUrl);
          window.open(sanitizedUrl, '_blank', 'noopener,noreferrer');
        }
      }
    } catch (error) {
      console.error('💥 Task click error:', error);
      toast({
        title: "Ошибка выполнения задания",
        description: error instanceof Error ? error.message : 'Произошла ошибка',
        variant: "destructive"
      });
    }
  };

  const handleClaimReward = async (task: Task) => {
    try {
      console.log('🎁 Claiming reward for:', task.title);
      
      // Валидация входных данных
      if (!validateInput(task.id, 'uuid')) {
        console.error('❌ Invalid task ID for reward claim');
        return;
      }

      if (!validateInput(task.reward_coins, 'coins')) {
        console.error('❌ Invalid reward amount');
        return;
      }

      // Проверка rate limit
      const canProceed = await checkRateLimit('claim_task_reward', 3, 5);
      if (!canProceed) {
        toast({
          title: "Слишком много попыток",
          description: "Подождите перед получением следующей награды",
          variant: "destructive"
        });
        return;
      }

      const result = await claimReward.mutateAsync({ taskId: task.id });
      
      if (result?.new_balance !== undefined) {
        console.log('💰 Updating balance to:', result.new_balance);
        onCoinsUpdate(result.new_balance);
      } else {
        // Fallback - обновляем баланс локально
        onCoinsUpdate(currentUser.coins + task.reward_coins);
      }
    } catch (error) {
      console.error('💥 Reward claim error:', error);
      toast({
        title: "Ошибка получения награды",
        description: error instanceof Error ? error.message : 'Произошла ошибка',
        variant: "destructive"
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
                <div className="w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4 flex-shrink-0">
                  {task.image_url ? (
                    <LazyImage
                      src={task.image_url}
                      alt={sanitizeString(task.title)}
                      className="w-full h-full object-cover rounded-lg border border-gray-600/30"
                      timeout={3000}
                      fallback={
                        <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600/30">
                          <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                      }
                      onError={() => console.log('Failed to load task image for:', task.title)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600/30">
                      <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className={`font-semibold text-sm sm:text-base truncate ${
                      taskStatus === 'claimed' ? 'text-green-400' : 'text-white'
                    }`}>
                      {sanitizeString(task.title)}
                    </h3>
                    {taskStatus === 'claimed' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />}
                  </div>
                  <p className={`text-xs sm:text-sm mb-3 line-clamp-2 ${
                    taskStatus === 'claimed' ? 'text-green-300' : 'text-gray-400'
                  }`}>
                    {sanitizeString(task.description)}
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
                        className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-white disabled:cursor-not-allowed"
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
                        className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 text-white animate-pulse disabled:cursor-not-allowed"
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

export default TasksScreenFixed;
