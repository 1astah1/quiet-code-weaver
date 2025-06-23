
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SecurityMonitor = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const logSecurityEvent = async (action: string, details: any = {}) => {
      try {
        await supabase.rpc('log_security_event', {
          p_user_id: user.id,
          p_action: action,
          p_details: details,
          p_success: true,
          p_ip_address: null, // Could be enhanced with actual IP detection
          p_user_agent: navigator.userAgent
        });
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    };

    // Log session start
    logSecurityEvent('session_start', {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Monitor for suspicious activity
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEvent('session_backgrounded');
      } else {
        logSecurityEvent('session_foregrounded');
      }
    };

    const handleBeforeUnload = () => {
      logSecurityEvent('session_end');
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Monitor for console usage (potential tampering)
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
    };
    
    let consoleUsageCount = 0;
    
    // Override console methods with proper typing
    console.log = (...args: any[]) => {
      consoleUsageCount++;
      if (consoleUsageCount % 10 === 0) {
        logSecurityEvent('console_usage', {
          method: 'log',
          usage_count: consoleUsageCount,
          timestamp: new Date().toISOString()
        });
      }
      return originalConsole.log(...args);
    };

    console.warn = (...args: any[]) => {
      consoleUsageCount++;
      if (consoleUsageCount % 10 === 0) {
        logSecurityEvent('console_usage', {
          method: 'warn',
          usage_count: consoleUsageCount,
          timestamp: new Date().toISOString()
        });
      }
      return originalConsole.warn(...args);
    };

    console.error = (...args: any[]) => {
      consoleUsageCount++;
      if (consoleUsageCount % 10 === 0) {
        logSecurityEvent('console_usage', {
          method: 'error',
          usage_count: consoleUsageCount,
          timestamp: new Date().toISOString()
        });
      }
      return originalConsole.error(...args);
    };

    console.info = (...args: any[]) => {
      consoleUsageCount++;
      if (consoleUsageCount % 10 === 0) {
        logSecurityEvent('console_usage', {
          method: 'info',
          usage_count: consoleUsageCount,
          timestamp: new Date().toISOString()
        });
      }
      return originalConsole.info(...args);
    };

    console.debug = (...args: any[]) => {
      consoleUsageCount++;
      if (consoleUsageCount % 10 === 0) {
        logSecurityEvent('console_usage', {
          method: 'debug',
          usage_count: consoleUsageCount,
          timestamp: new Date().toISOString()
        });
      }
      return originalConsole.debug(...args);
    };

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Restore original console methods
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      
      // Log session end on cleanup
      logSecurityEvent('session_cleanup');
    };
  }, [user]);

  // This component doesn't render anything visible
  return null;
};

export default SecurityMonitor;
