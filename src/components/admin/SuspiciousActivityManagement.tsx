
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, User, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SuspiciousActivity {
  id: string;
  user_id: string;
  username: string;
  activity_type: string;
  details: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
}

const SuspiciousActivityManagement = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получаем текущего пользователя
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .maybeSingle();
        
        setCurrentUser(userData);
      }
    };
    getCurrentUser();
  }, []);

  // Загружаем подозрительную активность
  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['suspicious-activities'],
    queryFn: async () => {
      if (!currentUser?.is_admin) {
        throw new Error('Недостаточно прав');
      }

      console.log('🔍 [ADMIN] Loading suspicious activities...');
      
      const { data, error } = await supabase.rpc('get_suspicious_activities', {
        p_admin_id: currentUser.id,
        p_limit: 100,
        p_offset: 0
      });

      if (error) {
        console.error('❌ [ADMIN] Error loading suspicious activities:', error);
        throw error;
      }

      console.log('✅ [ADMIN] Loaded suspicious activities:', data?.length || 0);
      return data as SuspiciousActivity[];
    },
    enabled: !!currentUser?.is_admin,
    refetchInterval: 30000 // Обновляем каждые 30 секунд
  });

  // Мутация для разрешения активности
  const resolveMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('suspicious_activities')
        .update({
          resolved: true,
          resolved_by: currentUser.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suspicious-activities'] });
      toast({
        title: 'Активность разрешена',
        description: 'Подозрительная активность помечена как разрешенная',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось разрешить активность',
        variant: 'destructive',
      });
    }
  });

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Shield className="h-4 w-4" />;
      case 'low': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Управление подозрительной активностью
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Ошибка загрузки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Не удалось загрузить данные о подозрительной активности</p>
        </CardContent>
      </Card>
    );
  }

  const unresolvedActivities = activities.filter(activity => !activity.resolved);
  const resolvedActivities = activities.filter(activity => activity.resolved);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Управление подозрительной активностью
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-800">Неразрешенные</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{unresolvedActivities.length}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Разрешенные</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{resolvedActivities.length}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Общее количество</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{activities.length}</p>
            </div>
          </div>

          {unresolvedActivities.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-green-600">Нет неразрешенной подозрительной активности</p>
              <p className="text-gray-500">Все инциденты обработаны</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Неразрешенная активность ({unresolvedActivities.length})</h3>
              {unresolvedActivities.map((activity) => (
                <Card key={activity.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskLevelColor(activity.risk_level)}>
                          {getRiskLevelIcon(activity.risk_level)}
                          {activity.risk_level.toUpperCase()}
                        </Badge>
                        <span className="font-semibold">{activity.activity_type}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveMutation.mutate(activity.id)}
                        disabled={resolveMutation.isPending}
                      >
                        Разрешить
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Пользователь:</strong> {activity.username} ({activity.user_id.slice(0, 8)}...)</p>
                        <p><strong>Время:</strong> {format(new Date(activity.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</p>
                      </div>
                      <div>
                        <p><strong>Детали:</strong></p>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(activity.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuspiciousActivityManagement;
