
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Trash2, Users } from "lucide-react";

const UserDuplicatesCleaner = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: duplicates, isLoading } = useQuery({
    queryKey: ['user_duplicates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('auth_id, email, count(*)')
        .not('auth_id', 'is', null)
        .group('auth_id, email')
        .having('count(*) > 1');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: duplicateUsers } = useQuery({
    queryKey: ['duplicate_user_details'],
    queryFn: async () => {
      if (!duplicates?.length) return [];
      
      const authIds = duplicates.map(d => d.auth_id);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('auth_id', authIds)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!duplicates?.length
  });

  const cleanupDuplicates = async () => {
    if (!duplicateUsers?.length) return;

    setIsProcessing(true);
    try {
      // Группируем пользователей по auth_id
      const userGroups = duplicateUsers.reduce((acc, user) => {
        if (!acc[user.auth_id]) {
          acc[user.auth_id] = [];
        }
        acc[user.auth_id].push(user);
        return acc;
      }, {} as Record<string, typeof duplicateUsers>);

      let deletedCount = 0;

      for (const [authId, users] of Object.entries(userGroups)) {
        if (users.length > 1) {
          // Сортируем: сначала админы, потом по дате создания
          users.sort((a, b) => {
            if (a.is_admin && !b.is_admin) return -1;
            if (!a.is_admin && b.is_admin) return 1;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

          // Оставляем первого (самого старого или админа), удаляем остальных
          const toDelete = users.slice(1);
          
          for (const user of toDelete) {
            const { error } = await supabase
              .from('users')
              .delete()
              .eq('id', user.id);
            
            if (error) {
              console.error(`Error deleting user ${user.id}:`, error);
            } else {
              deletedCount++;
            }
          }
        }
      }

      toast({
        title: "Очистка завершена",
        description: `Удалено ${deletedCount} дублирующихся записей`,
      });

      queryClient.invalidateQueries({ queryKey: ['user_duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate_user_details'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });

    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось очистить дубликаты",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Проверка дубликатов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Управление дубликатами пользователей
        </CardTitle>
        <CardDescription>
          Найдено {duplicates?.length || 0} групп дублирующихся пользователей
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {duplicates?.length ? (
          <>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Обнаружены дубликаты</span>
              </div>
              <p className="text-sm text-gray-300">
                В системе найдены пользователи с одинаковыми auth_id. 
                Это может вызывать проблемы с авторизацией.
              </p>
            </div>

            <div className="space-y-2">
              {duplicates.map((duplicate, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm">
                    <span className="text-gray-400">Auth ID:</span> {duplicate.auth_id}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-400">Email:</span> {duplicate.email}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-400">Количество дубликатов:</span> {duplicate.count}
                  </p>
                </div>
              ))}
            </div>

            <Button
              onClick={cleanupDuplicates}
              disabled={isProcessing}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isProcessing ? 'Очистка...' : 'Очистить дубликаты'}
            </Button>

            <p className="text-xs text-gray-400">
              Будут удалены более новые записи, админы сохранятся приоритетно
            </p>
          </>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400 text-sm">
              ✅ Дубликаты пользователей не найдены
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserDuplicatesCleaner;
