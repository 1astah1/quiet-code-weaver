import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityMetrics {
  rateLimitViolations: number;
  suspiciousActions: number;
  lastViolation: Date | null;
}

interface User {
  id: string;
  is_admin?: boolean;
}

export const useEnhancedSecurity = (user: User) => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    rateLimitViolations: 0,
    suspiciousActions: 0,
    lastViolation: null
  });
  const [isBlocked, setIsBlocked] = useState(false);

  // ИСПРАВЛЕНО: Проверяем статус администратора
  const isAdmin = user.is_admin || false;

  // Проверка rate limit через RPC функцию
  const checkRateLimit = useCallback(async (
    action: string, 
    maxAttempts: number = 10, 
    windowMinutes: number = 60
  ): Promise<boolean> => {
    try {
      // ИСПРАВЛЕНО: Администраторы всегда проходят проверку rate limit
      if (isAdmin) {
        console.log(`👑 [SECURITY] Admin user bypassing rate limit for action: ${action}`);
        return true;
      }

      console.log(`🔒 Checking rate limit for action: ${action}`);
      
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_action: action,
        p_max_attempts: maxAttempts,
        p_window_minutes: windowMinutes
      });

      if (error) {
        console.error('❌ Rate limit check error:', error);
        return false; // В случае ошибки блокируем действие
      }

      const canProceed = data as boolean;
      
      if (!canProceed) {
        console.warn(`🚫 Rate limit exceeded for action: ${action}`);
        setMetrics(prev => ({
          ...prev,
          rateLimitViolations: prev.rateLimitViolations + 1,
          lastViolation: new Date()
        }));
        setIsBlocked(true);
        
        // Снимаем блокировку через 5 минут
        setTimeout(() => {
          setIsBlocked(false);
        }, 5 * 60 * 1000);
      }

      return canProceed;
    } catch (error) {
      console.error('💥 Security check failed:', error);
      return isAdmin; // Администраторы проходят даже при ошибках
    }
  }, [user.id, isAdmin]);

  // Валидация входных данных
  const validateInput = useCallback((input: any, type: 'uuid' | 'coins' | 'string'): boolean => {
    switch (type) {
      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(input);
      
      case 'coins':
        return Number.isInteger(input) && input >= 0 && input <= 10000000;
      
      case 'string':
        return typeof input === 'string' && input.length <= 1000;
      
      default:
        return false;
    }
  }, []);

  // Санитизация строк
  const sanitizeString = useCallback((input: string): string => {
    return input
      .replace(/[<>'"&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      })
      .trim()
      .slice(0, 1000);
  }, []);

  // Логирование подозрительной активности
  const logSuspiciousActivity = useCallback(async (
    activity: string,
    details: Record<string, any>
  ): Promise<void> => {
    try {
      // ИСПРАВЛЕНО: Не логируем активность администраторов как подозрительную
      if (isAdmin) {
        console.log(`👑 [SECURITY] Admin activity ignored: ${activity}`, details);
        return;
      }

      console.warn(`🚨 Suspicious activity detected: ${activity}`, details);
      
      setMetrics(prev => ({
        ...prev,
        suspiciousActions: prev.suspiciousActions + 1,
        lastViolation: new Date()
      }));

      // В реальном приложении здесь был бы вызов к серверу для логирования
      // await supabase.from('security_audit_log').insert({...})
      
    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  }, [isAdmin]);

  return {
    metrics,
    isBlocked: isBlocked && !isAdmin, // ИСПРАВЛЕНО: Администраторы никогда не блокируются
    checkRateLimit,
    validateInput,
    sanitizeString,
    logSuspiciousActivity,
    isAdmin
  };
};
