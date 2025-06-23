
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTasks = (userId?: string) => {
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        throw tasksError;
      }

      if (!userId) {
        return tasks?.map(task => ({ ...task, status: 'available' })) || [];
      }

      // Получаем прогресс пользователя
      const { data: progress, error: progressError } = await supabase
        .from('user_task_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) {
        console.error('Error fetching task progress:', progressError);
        throw progressError;
      }

      // Объединяем задания с прогрессом
      const tasksWithProgress = tasks?.map(task => {
        const userProgress = progress?.find(p => p.task_id === task.id);
        return {
          ...task,
          status: userProgress?.status || 'available',
          completed_at: userProgress?.completed_at,
          claimed_at: userProgress?.claimed_at
        };
      }) || [];

      return tasksWithProgress;
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
