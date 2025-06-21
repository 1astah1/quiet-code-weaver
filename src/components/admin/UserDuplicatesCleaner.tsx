import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Trash2, Users } from "lucide-react";

interface DuplicateGroup {
  auth_id: string;
  email: string;
  count: number;
  users: any[];
}

const UserDuplicatesCleaner = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ['all_users_for_duplicates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .not('auth_id', 'is', null)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Process users to find duplicates
  const duplicateGroups: DuplicateGroup[] = [];
  if (allUsers) {
    const authIdGroups: Record<string, any[]> = {};
    
    // Group users by auth_id
    allUsers.forEach(user => {
      if (!authIdGroups[user.auth_id]) {
        authIdGroups[user.auth_id] = [];
      }
      authIdGroups[user.auth_id].push(user);
    });

    // Find groups with more than one user
    Object.entries(authIdGroups).forEach(([authId, users]) => {
      if (users.length > 1) {
        duplicateGroups.push({
          auth_id: authId,
          email: users[0].email || 'No email',
          count: users.length,
          users: users
        });
      }
    });
  }

  const cleanupDuplicates = async () => {
    if (!duplicateGroups.length) return;

    setIsProcessing(true);
    try {
      let deletedCount = 0;

      for (const group of duplicateGroups) {
        if (group.users.length > 1) {
          // Sort: admins first, then by creation date
          group.users.sort((a, b) => {
            if (a.is_admin && !b.is_admin) return -1;
            if (!a.is_admin && b.is_admin) return 1;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

          // Keep the first (oldest or admin), delete the rest
          const toDelete = group.users.slice(1);
          
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

      queryClient.invalidateQueries({ queryKey: ['all_users_for_duplicates'] });
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
          Найдено {duplicateGroups.length} групп дублирующихся пользователей
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {duplicateGroups.length > 0 ? (
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
              {duplicateGroups.map((duplicate, index) => (
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
