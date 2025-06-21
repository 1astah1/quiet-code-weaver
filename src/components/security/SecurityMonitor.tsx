
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SecurityRateLimiter } from '@/utils/security';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'rate_limit' | 'validation_error' | 'suspicious_activity';
  message: string;
}

const SecurityMonitor: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkSecurity = () => {
      // Проверяем статус rate limiting для различных действий
      const actions = ['sell_skin', 'open_case', 'quiz_answer', 'restore_lives'];
      let hasBlocks = false;

      actions.forEach(action => {
        const remaining = SecurityRateLimiter.getRemainingTime(user.id, action);
        if (remaining > 0) {
          hasBlocks = true;
        }
      });

      setIsBlocked(hasBlocks);
    };

    const interval = setInterval(checkSecurity, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Функция для добавления события безопасности
  const addSecurityEvent = (type: SecurityEvent['type'], message: string) => {
    const event: SecurityEvent = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message
    };

    setEvents(prev => [event, ...prev.slice(0, 4)]); // Храним только последние 5 событий
  };

  // Слушаем события безопасности из консоли
  useEffect(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.join(' ');
      if (message.includes('Rate limit exceeded')) {
        addSecurityEvent('rate_limit', 'Превышен лимит запросов');
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.join(' ');
      if (message.includes('Invalid') || message.includes('validation')) {
        addSecurityEvent('validation_error', 'Ошибка валидации данных');
      }
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  if (!user || events.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      {isBlocked && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700">
            Временное ограничение активности для безопасности
          </AlertDescription>
        </Alert>
      )}

      {events.map(event => (
        <Alert key={event.id} className="border-red-500 bg-red-50">
          <Shield className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            {event.message}
            <span className="block text-xs text-red-500 mt-1">
              {event.timestamp.toLocaleTimeString()}
            </span>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default SecurityMonitor;
