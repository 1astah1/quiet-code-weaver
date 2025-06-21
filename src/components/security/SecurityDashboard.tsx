
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SecurityAlert from './SecurityAlert';
import SecurityMonitor from './SecurityMonitor';
import AdvancedSecurityMonitor from './AdvancedSecurityMonitor';

const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Панель безопасности</h1>
        <div className="text-sm text-slate-400">
          ID: {user.id.slice(0, 8)}...
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="monitoring">Мониторинг</TabsTrigger>
          <TabsTrigger value="alerts">Алерты</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Общая безопасность</CardTitle>
              <CardDescription className="text-slate-300">
                Обзор состояния безопасности вашего аккаунта
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedSecurityMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Активный мониторинг</CardTitle>
              <CardDescription className="text-slate-300">
                Отслеживание активности в реальном времени
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Уведомления безопасности</CardTitle>
              <CardDescription className="text-slate-300">
                Важные предупреждения и ограничения
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityAlert userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
