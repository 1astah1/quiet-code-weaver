
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Crown, Coins } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      console.log('Загрузка пользователей...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Ошибка загрузки пользователей:', error);
        throw error;
      }
      
      console.log('Пользователи загружены:', data);
      return data || [];
    }
  });

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast({
        title: "Статус обновлен",
        description: `Права администратора ${!currentStatus ? 'выданы' : 'отозваны'}`,
      });
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус пользователя",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Управление пользователями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Загрузка пользователей...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Управление пользователями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400">Ошибка загрузки пользователей</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Управление пользователями
        </CardTitle>
        <CardDescription>
          Всего пользователей: {users?.length || 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Монеты</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {user.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="font-medium">{user.username || 'Неизвестный'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {user.email || 'Не указан'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span>{user.coins || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.is_admin && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Админ
                          </Badge>
                        )}
                        {user.premium_until && new Date(user.premium_until) > new Date() && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Премиум
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {user.created_at ? formatDate(user.created_at) : 'Неизвестно'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={user.is_admin ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleAdminStatus(user.id, user.is_admin || false)}
                      >
                        {user.is_admin ? 'Убрать админа' : 'Сделать админом'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Пользователи не найдены</p>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
