
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, User, Calendar, CheckCircle, Database } from 'lucide-react';

const SuspiciousActivityManagement = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTableReady, setIsTableReady] = useState(false);
  const { toast } = useToast();

  // Получаем текущего пользователя
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
        if (session?.user) {
          const { data: userData } = await (await import('@/integrations/supabase/client')).supabase
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

  // Таблица suspicious_activities пока не создана, поэтому всегда показываем что не готова
  useEffect(() => {
    if (currentUser?.is_admin) {
      setIsTableReady(false); // Таблица еще не создана
    }
  }, [currentUser]);

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

  if (!isTableReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Система подозрительной активности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-yellow-600 mb-2">Таблица не готова</p>
            <p className="text-gray-600 mb-4">
              Таблица подозрительной активности еще не была создана в базе данных.
            </p>
            <p className="text-sm text-gray-500">
              Пожалуйста, сначала выполните SQL миграцию для создания необходимых таблиц и функций.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Система активна</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">Готова к работе</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Мониторинг</span>
              </div>
              <p className="text-sm text-green-600 mt-1">Отслеживание активности</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Ожидание</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">Ожидание данных</p>
            </div>
          </div>

          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-green-600">Система мониторинга готова</p>
            <p className="text-gray-500 mb-4">
              Система начнет отслеживать подозрительную активность автоматически
            </p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Мониторинг покупок</p>
              <p>• Отслеживание rate limiting</p>
              <p>• Проверка аномальной активности</p>
              <p>• Администраторы исключены из проверок</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuspiciousActivityManagement;
