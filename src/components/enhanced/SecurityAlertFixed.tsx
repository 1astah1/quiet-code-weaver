
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, X, Clock } from 'lucide-react';
import { useEnhancedSecurity } from '@/hooks/useEnhancedSecurity';

interface SecurityAlertFixedProps {
  userId: string;
}

interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  autoHide?: boolean;
}

const SecurityAlertFixed: React.FC<SecurityAlertFixedProps> = ({ userId }) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const { metrics, isBlocked, checkRateLimit } = useEnhancedSecurity(userId);

  useEffect(() => {
    console.log('🛡️ [SECURITY_ALERT] Monitoring user:', userId);
    
    // Проверяем различные действия на предмет rate limiting
    const checkSecurityStatus = async () => {
      const criticalActions = [
        { action: 'complete_task', label: 'выполнение заданий', maxAttempts: 5 },
        { action: 'claim_task_reward', label: 'получение наград', maxAttempts: 3 },
        { action: 'open_case', label: 'открытие кейсов', maxAttempts: 10 },
        { action: 'sell_skin', label: 'продажа скинов', maxAttempts: 8 }
      ];
      
      for (const { action, label, maxAttempts } of criticalActions) {
        const canPerform = await checkRateLimit(action, maxAttempts, 10);
        
        if (!canPerform) {
          const alertId = `${action}_${Date.now()}`;
          console.log(`🚨 [SECURITY_ALERT] Rate limit exceeded for ${action}`);
          
          setAlerts(prev => {
            // Проверяем, есть ли уже такой алерт
            if (prev.some(alert => alert.message.includes(label))) {
              return prev;
            }
            
            return [...prev, {
              id: alertId,
              type: 'warning',
              message: `Временное ограничение на ${label}`,
              timestamp: new Date(),
              autoHide: true
            }];
          });
          
          // Автоматически убираем алерт через 15 секунд
          setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== alertId));
          }, 15000);
        }
      }
    };

    if (userId) {
      checkSecurityStatus();
      const interval = setInterval(checkSecurityStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, checkRateLimit]);

  // Добавляем алерт при блокировке
  useEffect(() => {
    if (isBlocked) {
      const blockAlertId = `blocked_${Date.now()}`;
      console.log('🚫 [SECURITY_ALERT] User is blocked');
      
      setAlerts(prev => {
        if (prev.some(alert => alert.type === 'error' && alert.message.includes('заблокирован'))) {
          return prev;
        }
        
        return [...prev, {
          id: blockAlertId,
          type: 'error',
          message: 'Ваш аккаунт временно заблокирован из-за подозрительной активности',
          timestamp: new Date(),
          autoHide: false
        }];
      });
    } else {
      // Убираем алерты о блокировке когда она снята
      setAlerts(prev => prev.filter(alert => !alert.message.includes('заблокирован')));
    }
  }, [isBlocked]);

  // Показываем информацию о метриках безопасности если есть нарушения
  useEffect(() => {
    if (metrics.rateLimitViolations > 0 || metrics.suspiciousActions > 0) {
      const metricsAlertId = `metrics_${Date.now()}`;
      console.log('📊 [SECURITY_ALERT] Security metrics alert:', metrics);
      
      setAlerts(prev => {
        if (prev.some(alert => alert.message.includes('Обнаружена'))) {
          return prev;
        }
        
        return [...prev, {
          id: metricsAlertId,
          type: 'info',
          message: `Обнаружена подозрительная активность (${metrics.rateLimitViolations + metrics.suspiciousActions} нарушений)`,
          timestamp: new Date(),
          autoHide: true
        }];
      });
      
      setTimeout(() => {
        setAlerts(prev => prev.filter(alert => alert.id !== metricsAlertId));
      }, 20000);
    }
  }, [metrics.rateLimitViolations, metrics.suspiciousActions]);

  const removeAlert = (alertId: string) => {
    console.log('❌ [SECURITY_ALERT] Removing alert:', alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {alerts.map(alert => (
        <Alert 
          key={alert.id} 
          className={`${
            alert.type === 'error' 
              ? 'border-red-500 bg-red-50' 
              : alert.type === 'warning'
              ? 'border-orange-500 bg-orange-50'
              : 'border-blue-500 bg-blue-50'
          } relative shadow-lg`}
        >
          {alert.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : alert.type === 'warning' ? (
            <Shield className="h-4 w-4 text-orange-500" />
          ) : (
            <Clock className="h-4 w-4 text-blue-500" />
          )}
          <AlertDescription className={`${
            alert.type === 'error' 
              ? 'text-red-700' 
              : alert.type === 'warning'
              ? 'text-orange-700'
              : 'text-blue-700'
          } pr-8`}>
            {alert.message}
            <span className="block text-xs mt-1 opacity-70">
              {alert.timestamp.toLocaleTimeString()}
            </span>
          </AlertDescription>
          <button
            onClick={() => removeAlert(alert.id)}
            className={`absolute top-2 right-2 ${
              alert.type === 'error' 
                ? 'text-red-500' 
                : alert.type === 'warning'
                ? 'text-orange-500'
                : 'text-blue-500'
            } hover:opacity-70 transition-opacity`}
          >
            <X className="h-3 w-3" />
          </button>
        </Alert>
      ))}
    </div>
  );
};

export default SecurityAlertFixed;
