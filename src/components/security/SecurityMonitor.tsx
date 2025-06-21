
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
  console.log('🛡️ [SECURITY_MONITOR] Component mounting/rendering');
  
  const { user } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!user) {
      console.log('❌ [SECURITY_MONITOR] No user, skipping security checks');
      return;
    }

    console.log('🔄 [SECURITY_MONITOR] Starting security monitoring for user:', user.id);

    const checkSecurity = () => {
      console.log('🔍 [SECURITY_MONITOR] Running security check...');
      
      const actions = ['sell_skin', 'open_case', 'quiz_answer', 'restore_lives'];
      let hasBlocks = false;
      const blockedActions: string[] = [];

      actions.forEach(action => {
        const remaining = SecurityRateLimiter.getRemainingTime(user.id, action);
        if (remaining > 0) {
          hasBlocks = true;
          blockedActions.push(action);
          console.log(`⏰ [SECURITY_MONITOR] Action ${action} blocked for ${remaining}ms`);
        }
      });

      if (hasBlocks !== isBlocked) {
        console.log('🚨 [SECURITY_MONITOR] Block status changed:', { 
          wasBlocked: isBlocked, 
          nowBlocked: hasBlocks,
          blockedActions 
        });
        setIsBlocked(hasBlocks);
      }
    };

    checkSecurity(); // Первоначальная проверка
    const interval = setInterval(checkSecurity, 1000);
    
    return () => {
      console.log('🛑 [SECURITY_MONITOR] Stopping security monitoring');
      clearInterval(interval);
    };
  }, [user, isBlocked]);

  const addSecurityEvent = (type: SecurityEvent['type'], message: string) => {
    const event: SecurityEvent = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message
    };

    console.log('🚨 [SECURITY_MONITOR] Adding security event:', event);
    setEvents(prev => [event, ...prev.slice(0, 4)]);
  };

  // Слушаем события безопасности из консоли
  useEffect(() => {
    console.log('👂 [SECURITY_MONITOR] Setting up console monitoring...');
    
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.join(' ');
      
      if (message.includes('Rate limit exceeded')) {
        console.log('🚨 [SECURITY_MONITOR] Rate limit warning detected');
        addSecurityEvent('rate_limit', 'Превышен лимит запросов');
      }
      
      if (message.includes('Suspicious activity')) {
        console.log('🚨 [SECURITY_MONITOR] Suspicious activity warning detected');
        addSecurityEvent('suspicious_activity', 'Подозрительная активность');
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.join(' ');
      
      if (message.includes('Invalid') || message.includes('validation')) {
        console.log('🚨 [SECURITY_MONITOR] Validation error detected');
        addSecurityEvent('validation_error', 'Ошибка валидации данных');
      }
      
      if (message.includes('auth') || message.includes('authentication')) {
        console.log('🚨 [SECURITY_MONITOR] Auth error detected');
        addSecurityEvent('validation_error', 'Ошибка аутентификации');
      }
    };

    return () => {
      console.log('🛑 [SECURITY_MONITOR] Restoring original console methods');
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  // Проверяем видимость компонента
  useEffect(() => {
    const shouldShow = user && (events.length > 0 || isBlocked);
    console.log('👁️ [SECURITY_MONITOR] Visibility check:', {
      hasUser: !!user,
      eventsCount: events.length,
      isBlocked,
      shouldShow
    });
  }, [user, events.length, isBlocked]);

  if (!user || (events.length === 0 && !isBlocked)) {
    console.log('🚫 [SECURITY_MONITOR] Not rendering (no user or no events/blocks)');
    return null;
  }

  console.log('✅ [SECURITY_MONITOR] Rendering security alerts:', {
    eventsCount: events.length,
    isBlocked,
    userId: user.id
  });

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

      {events.map(event => {
        console.log('🎨 [SECURITY_MONITOR] Rendering event:', event);
        return (
          <Alert key={event.id} className="border-red-500 bg-red-50">
            <Shield className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {event.message}
              <span className="block text-xs text-red-500 mt-1">
                {event.timestamp.toLocaleTimeString()}
              </span>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
};

export default SecurityMonitor;
