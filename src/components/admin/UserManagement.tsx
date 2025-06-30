import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Crown, Coins, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import UserBalanceModal from "./UserBalanceModal";
import { ExtendedUser } from "@/utils/supabaseTypes";

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const { data: users, isLoading, error } = useQuery<ExtendedUser[]>({
    queryKey: ['admin_users'],
    queryFn: async () => {
      console.log('Загрузка пользователей...');
      // ИСПРАВЛЕНО: Используем LEFT JOIN вместо INNER JOIN чтобы показать всех пользователей
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_roles(role)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Ошибка загрузки пользователей:', error);
        throw error;
      }
      
      console.log('Пользователи загружены:', data);
      return (data || []) as ExtendedUser[];
    }
  });

  const toggleAdminStatus = async (userId: string, hasAdminRole: boolean) => {
    setLoadingStates(prev => ({ ...prev, [userId]: true }));
    
    try {
      console.log('Переключение админ статуса:', { userId, hasAdminRole });
      
      const { data, error } = await supabase.rpc('toggle_admin_role', {
        p_user_id: userId,
        p_grant_admin: !hasAdminRole
      });

      if (error) {
        console.error('Ошибка RPC:', error);
        throw error;
      }

      // ИСПРАВЛЕНО: Правильная типизация ответа RPC
      const result = data as { success: boolean; error?: string };
      
      if (!result?.success) {
        throw new Error(result?.error || 'Неизвестная ошибка');
      }

      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast({
        title: "Статус обновлен",
        description: `Права администратора ${!hasAdminRole ? 'выданы' : 'отозваны'}`,
      });
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус пользователя",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  const openBalanceModal = (user: ExtendedUser) => {
    setSelectedUser(user);
    setIsBalanceModalOpen(true);
  };

  const handleBalanceUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin_users'] });
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

  // ИСПРАВЛЕНО: Проверяем роли правильно с учетом LEFT JOIN
  const checkUserHasRole = (user: ExtendedUser, role: string) => {
    return Array.isArray(user.user_roles) && user.user_roles.some((userRole: any) => userRole?.role === role) || false;
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Управление пользователями
          </CardTitle>
          <CardDescription>
            Всего пользователей: {Array.isArray(users) ? users.length : 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Array.isArray(users) && users.length > 0 ? (
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
                  {users.map((user) => {
                    const hasAdminRole = checkUserHasRole(user, 'admin');
                    const isLoading = loadingStates[user.id] || false;
                    
                    return (
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
                            <span>{user.coins ?? 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {hasAdminRole && (
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openBalanceModal(user)}
                              className="flex items-center gap-1"
                              disabled={isLoading}
                            >
                              <DollarSign className="w-3 h-3" />
                              Баланс
                            </Button>
                            <Button
                              variant={hasAdminRole ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleAdminStatus(user.id, hasAdminRole)}
                              disabled={isLoading}
                            >
                              {isLoading ? 'Обновление...' : (hasAdminRole ? 'Убрать админа' : 'Сделать админом')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Пользователи не найдены</p>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <UserBalanceModal
          isOpen={isBalanceModalOpen}
          onClose={() => setIsBalanceModalOpen(false)}
          user={selectedUser}
          onBalanceUpdate={handleBalanceUpdate}
        />
      )}
    </>
  );
};

export default UserManagement;
