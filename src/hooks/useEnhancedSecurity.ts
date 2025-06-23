
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SecurityConfig {
  maxAttempts: number;
  windowMinutes: number;
  suspiciousThreshold: number;
}

interface UserContext {
  id: string;
  isAdmin?: boolean;
}

export const useEnhancedSecurity = (user: UserContext) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Более разумные лимиты безопасности
  const securityConfigs: Record<string, SecurityConfig> = {
    purchase_skin: { maxAttempts: 10, windowMinutes: 10, suspiciousThreshold: 15 },
    sell_skin: { maxAttempts: 20, windowMinutes: 10, suspiciousThreshold: 30 },
    open_case: { maxAttempts: 50, windowMinutes: 10, suspiciousThreshold: 100 },
    complete_task: { maxAttempts: 5, windowMinutes: 10, suspiciousThreshold: 10 },
    claim_task_reward: { maxAttempts: 3, windowMinutes: 5, suspiciousThreshold: 5 }
  };

  const checkRateLimit = useCallback(async (action: string, customLimit?: number, customWindow?: number): Promise<boolean> => {
    if (user.isAdmin) return true; // Админы не ограничиваются

    const config = securityConfigs[action] || { maxAttempts: 5, windowMinutes: 10, suspiciousThreshold: 10 };
    const maxAttempts = customLimit || config.maxAttempts;
    const windowMinutes = customWindow || config.windowMinutes;

    const key = `${action}_${Date.now() - (Date.now() % (windowMinutes * 60000))}`;
    const currentCount = actionCounts[key] || 0;

    if (currentCount >= maxAttempts) {
      toast({
        title: "Превышен лимит действий",
        description: `Слишком много попыток "${action}". Подождите ${windowMinutes} минут.`,
        variant: "destructive"
      });
      return false;
    }

    // Проверяем на подозрительную активность
    if (currentCount > config.suspiciousThreshold * 0.7) {
      console.warn(`🚨 Suspicious activity detected for user ${user.id}: ${action} - ${currentCount} attempts`);
    }

    setActionCounts(prev => ({
      ...prev,
      [key]: currentCount + 1
    }));

    return true;
  }, [user, actionCounts, toast]);

  const validateInput = useCallback((value: any, type: 'uuid' | 'coins' | 'string'): boolean => {
    switch (type) {
      case 'uuid':
        return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      case 'coins':
        return typeof value === 'number' && value > 0 && value <= 100000;
      case 'string':
        return typeof value === 'string' && value.length > 0 && value.length <= 1000;
      default:
        return false;
    }
  }, []);

  const sanitizeString = useCallback((str: string): string => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
              .trim();
  }, []);

  return {
    checkRateLimit,
    validateInput,
    sanitizeString,
    isBlocked,
    setIsBlocked
  };
};
