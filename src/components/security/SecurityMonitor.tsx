
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RateLimiter } from '@/utils/validation';

const SecurityMonitor: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Простая проверка rate limit для критичных действий
    const checkRateLimit = () => {
      const actions = ['case_open', 'skin_sell', 'task_complete'];
      
      actions.forEach(action => {
        if (!RateLimiter.canPerformAction(user.id, action)) {
          console.warn(`🚨 Rate limit exceeded for ${action}`);
        }
      });
    };

    const interval = setInterval(checkRateLimit, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return null; // Invisible monitoring component
};

export default SecurityMonitor;
