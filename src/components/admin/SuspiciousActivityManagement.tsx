import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Shield, User, Calendar, CheckCircle, Database, RefreshCw } from 'lucide-react';
import { safeArrayLength, safeArrayMap } from '@/utils/arrayUtils';

const SuspiciousActivityManagement = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  // Load current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .maybeSingle();
          
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Query suspicious activities
  const { data: activities, isLoading, error, refetch } = useQuery({
    queryKey: ['suspicious_activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suspicious_activities')
        .select(`
          *,
          users(username, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.is_admin
  });

  if (!currentUser?.is_admin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Недостаточно прав для просмотра этого раздела
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatEventType = (type: string) => {
    const types: Record<string, string> = {
      'suspicious_purchase': 'Подозрительная покупка',
      'rate_limit_exceeded': 'Превышен лимит запросов',
      'unusual_activity': 'Необычная активность',
      'admin_action': 'Действие администратора'
    };
    return types[type] || type;
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      'suspicious_purchase': 'bg-red-100 text-red-800',
      'rate_limit_exceeded': 'bg-yellow-100 text-yellow-800',
      'unusual_activity': 'bg-orange-100 text-orange-800',
      'admin_action': 'bg-blue-100 text-blue-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Подозрительная активность
            </div>
            <Button onClick={() => refetch()} disabled={isLoading} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Загрузка данных...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-red-600 mb-2">Ошибка загрузки</p>
              <p className="text-gray-500">Не удалось загрузить данные о подозрительной активности</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-400" />
                    <span className="font-semibold text-white">Всего событий</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400 mt-2">{safeArrayLength(activities)}</p>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <span className="font-semibold text-white">За сегодня</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400 mt-2">
                    {safeArrayLength(activities?.filter?.((a: any) => 
                      new Date(a.created_at).toDateString() === new Date().toDateString()
                    ))}
                  </p>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-green-400" />
                    <span className="font-semibold text-white">Уникальных пользователей</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400 mt-2">
                    {new Set(activities?.map?.((a: any) => a.user_id).filter(Boolean)).size || 0}
                  </p>
                </div>
              </div>

              {safeArrayLength(activities) > 0 ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-300">Время</TableHead>
                        <TableHead className="text-gray-300">Пользователь</TableHead>
                        <TableHead className="text-gray-300">Тип события</TableHead>
                        <TableHead className="text-gray-300">Детали</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeArrayMap(activities, (activity: any) => (
                        <TableRow key={activity.id}>
                          <TableCell className="text-gray-300">
                            {new Date(activity.created_at).toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {activity.users?.username || 'Неизвестный'}
                            {activity.users?.email && (
                              <div className="text-xs text-gray-500">{activity.users.email}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getEventColor(activity.type)}>
                              {formatEventType(activity.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {activity.details ? (
                              <div className="text-xs">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(activity.details, null, 2)}
                                </pre>
                              </div>
                            ) : (
                              <span className="text-gray-500">Нет данных</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-green-600">Подозрительной активности не обнаружено</p>
                  <p className="text-gray-500">Система мониторинга работает в штатном режиме</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuspiciousActivityManagement;
