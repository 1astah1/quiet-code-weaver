
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Eye, Clock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface SecurityMetrics {
  suspiciousActivities: number;
  rateLimitHits: number;
  failedOperations: number;
  lastActivity: Date | null;
}

const AdvancedSecurityMonitor: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    suspiciousActivities: 0,
    rateLimitHits: 0,
    failedOperations: 0,
    lastActivity: null
  });
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    if (!user) return;

    const loadSecurityMetrics = async () => {
      try {
        // Загружаем статистику безопасности за последние 24 часа
        const { data: auditLogs, error } = await supabase
          .from('security_audit_log')
          .select('action, success, created_at')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading security metrics:', error);
          return;
        }

        if (auditLogs && auditLogs.length > 0) {
          const suspiciousActivities = auditLogs.filter(log => 
            log.action.includes('suspicious') || log.action.includes('invalid')
          ).length;

          const rateLimitHits = auditLogs.filter(log => 
            log.action.includes('rate_limit') || !log.success
          ).length;

          const failedOperations = auditLogs.filter(log => !log.success).length;

          const lastActivity = auditLogs.length > 0 ? new Date(auditLogs[0].created_at) : null;

          setMetrics({
            suspiciousActivities,
            rateLimitHits,
            failedOperations,
            lastActivity
          });

          // Генерируем алерты на основе метрик
          const newAlerts = [];

          if (suspiciousActivities > 5) {
            newAlerts.push({
              id: `suspicious_${Date.now()}`,
              type: 'error' as const,
              message: `Обнаружено ${suspiciousActivities} подозрительных действий`,
              timestamp: new Date()
            });
          }

          if (rateLimitHits > 10) {
            newAlerts.push({
              id: `rate_limit_${Date.now()}`,
              type: 'warning' as const,
              message: 'Частые ограничения скорости действий',
              timestamp: new Date()
            });
          }

          setAlerts(newAlerts);
        }
      } catch (error) {
        console.error('Error in security monitoring:', error);
      }
    };

    loadSecurityMetrics();
    const interval = setInterval(loadSecurityMetrics, 60000); // Обновляем каждую минуту

    return () => clearInterval(interval);
  }, [user]);

  const removeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Метрики безопасности */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-slate-300">Подозрительно</span>
          </div>
          <div className="text-lg font-bold text-white">{metrics.suspiciousActivities}</div>
        </div>

        <div className="bg-slate-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-slate-300">Ограничений</span>
          </div>
          <div className="text-lg font-bold text-white">{metrics.rateLimitHits}</div>
        </div>

        <div className="bg-slate-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-red-500" />
            <span className="text-sm text-slate-300">Неудач</span>
          </div>
          <div className="text-lg font-bold text-white">{metrics.failedOperations}</div>
        </div>

        <div className="bg-slate-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-slate-300">Активность</span>
          </div>
          <div className="text-xs text-white">
            {metrics.lastActivity ? metrics.lastActivity.toLocaleTimeString() : 'Нет данных'}
          </div>
        </div>
      </div>

      {/* Алерты безопасности */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Alert 
              key={alert.id} 
              className={`${
                alert.type === 'error' 
                  ? 'border-red-500 bg-red-50' 
                  : alert.type === 'warning'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-blue-500 bg-blue-50'
              } relative`}
            >
              {alert.type === 'error' ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : alert.type === 'warning' ? (
                <Clock className="h-4 w-4 text-orange-500" />
              ) : (
                <Shield className="h-4 w-4 text-blue-500" />
              )}
              <AlertDescription className={`${
                alert.type === 'error' ? 'text-red-700' : 
                alert.type === 'warning' ? 'text-orange-700' : 'text-blue-700'
              } pr-8`}>
                {alert.message}
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="absolute top-2 right-2 text-xs opacity-70 hover:opacity-100"
                >
                  ✕
                </button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedSecurityMonitor;
