
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, X } from 'lucide-react';
import { SecurityMonitor } from '@/utils/securityEnhanced';
import { useAuth } from '@/hooks/useAuth';

interface SecurityAlertProps {
  userId: string;
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({ userId }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>>([]);

  // Check if user is admin
  const isAdmin = user?.is_admin || false;

  useEffect(() => {
    // Skip all security checks for admin users
    if (isAdmin) {
      console.log('👑 [SECURITY_ALERT] Admin user detected, skipping security checks');
      return;
    }

    // Check rate limits for critical actions
    const checkSecurityStatus = async () => {
      const criticalActions = ['complete_task', 'claim_task_reward', 'sell_skin'];
      
      for (const action of criticalActions) {
        // Use existing checkRateLimit method
        const canPerform = SecurityMonitor.checkClientRateLimit(userId, action, 10);
        
        if (!canPerform) {
          const alertId = `${action}_${Date.now()}`;
          setAlerts(prev => [...prev, {
            id: alertId,
            type: 'warning',
            message: `Временное ограничение на действие: ${action}`,
            timestamp: new Date()
          }]);
          
          // Auto-remove alert after 10 seconds
          setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== alertId));
          }, 10000);
        }
      }
    };

    if (userId) {
      checkSecurityStatus();
      const interval = setInterval(checkSecurityStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, isAdmin]);

  const removeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Don't render alerts for admin users
  if (isAdmin || alerts.length === 0) {
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
              : 'border-orange-500 bg-orange-50'
          } relative`}
        >
          {alert.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <Shield className="h-4 w-4 text-orange-500" />
          )}
          <AlertDescription className={`${
            alert.type === 'error' ? 'text-red-700' : 'text-orange-700'
          } pr-8`}>
            {alert.message}
            <span className="block text-xs mt-1 opacity-70">
              {alert.timestamp.toLocaleTimeString()}
            </span>
          </AlertDescription>
          <button
            onClick={() => removeAlert(alert.id)}
            className={`absolute top-2 right-2 ${
              alert.type === 'error' ? 'text-red-500' : 'text-orange-500'
            } hover:opacity-70`}
          >
            <X className="h-3 w-3" />
          </button>
        </Alert>
      ))}
    </div>
  );
};

export default SecurityAlert;
