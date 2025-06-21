
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Trash2, Users } from "lucide-react";

interface DuplicateGroup {
  key: string;
  field: string;
  value: string;
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
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Находим дубликаты по разным полям
  const duplicateGroups: DuplicateGroup[] = [];
  if (allUsers) {
    // Группируем по email
    const emailGroups: Record<string, any[]> = {};
    // Группируем по username
    const usernameGroups: Record<string, any[]> = {};
    // Группируем по auth_id
    const authIdGroups: Record<string, any[]> = {};
    
    allUsers.forEach(user => {
      // Группировка по email
      if (user.email) {
        if (!emailGroups[user.email]) {
          emailGroups[user.email] = [];
        }
        emailGroups[user.email].push(user);
      }

      // Группировка по username
      if (user.username) {
        if (!usernameGroups[user.username]) {
          usernameGroups[user.username] = [];
        }
        usernameGroups[user.username].push(user);
      }

      // Группировка по auth_id
      if (user.auth_id) {
        if (!authIdGroups[user.auth_id]) {
          authIdGroups[user.auth_id] = [];
        }
        authIdGroups[user.auth_id].push(user);
      }
    });

    // Добавляем группы с дубликатами
    Object.entries(emailGroups).forEach(([email, users]) => {
      if (users.length > 1) {
        duplicateGroups.push({
          key: `email-${email}`,
          field: 'Email',
          value: email,
          count: users.length,
          users: users
        });
      }
    });

    Object.entries(usernameGroups).forEach(([username, users]) => {
      if (users.length > 1) {
        duplicateGroups.push({
          key: `username-${username}`,
          field: 'Username',
          value: username,
          count: users.length,
          users: users
        });
      }
    });

    Object.entries(authIdGroups).forEach(([authId, users]) => {
      if (users.length > 1) {
        duplicateGroups.push({
          key: `auth_id-${authId}`,
          field: 'Auth ID',
          value: authId,
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
          // Сортируем: админы первыми, затем по дате создания (старые первыми)
          group.users.sort((a, b) => {
            if (a.is_admin && !b.is_admin) return -1;
            if (!a.is_admin && b.is_admin) return 1;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

          // Оставляем первого (старейшего или админа), удаляем остальных
          const toDelete = group.users.slice(1);
          
          for (const user of toDelete) {
            try {
              const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);
              
              if (error) {
                console.error(`Ошибка удаления пользователя ${user.id}:`, error);
                toast({
                  title: "Ошибка удаления",
                  description: `Не удалось удалить пользователя ${user.username}: ${error.message}`,
                  variant: "destructive",
                });
              } else {
                deletedCount++;
                console.log(`Удален пользователь ${user.username} (${user.id})`);
              }
            } catch (err) {
              console.error(`Ошибка при удалении пользователя ${user.id}:`, err);
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
      console.error('Ошибка очистки дубликатов:', error);
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
                В системе найдены пользователи с одинаковыми данными. 
                Это может вызывать проблемы в работе системы.
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {duplicateGroups.map((duplicate) => (
                <div key={duplicate.key} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">
                        <span className="text-gray-400">{duplicate.field}:</span> {duplicate.value}
                      </p>
                      <p className="text-sm text-gray-400">
                        Количество дубликатов: {duplicate.count}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500">Пользователи:</p>
                    {duplicate.users.map((user, index) => (
                      <div key={user.id} className="bg-gray-700 p-2 rounded text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-white">
                            {user.username} ({user.email})
                          </span>
                          <div className="flex gap-2 text-xs">
                            {user.is_admin && (
                              <span className="bg-red-600 px-1 rounded">Admin</span>
                            )}
                            <span className="text-gray-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                            {index === 0 && (
                              <span className="bg-green-600 px-1 rounded">Останется</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
