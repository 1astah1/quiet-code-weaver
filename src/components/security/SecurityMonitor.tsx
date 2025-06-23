
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
    const originalConsole = { ...console };
    let consoleUsageCount = 0;
    
    ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
      (console as any)[method] = (...args: any[]) => {
        consoleUsageCount++;
        if (consoleUsageCount % 10 === 0) { // Log every 10th console usage
          logSecurityEvent('console_usage', {
            method,
            usage_count: consoleUsageCount,
            timestamp: new Date().toISOString()
          });
        }
        return originalConsole[method as keyof typeof originalConsole](...args);
      };
    });

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Restore original console
      Object.assign(console, originalConsole);
      
      // Log session end on cleanup
      logSecurityEvent('session_cleanup');
    };
  }, [user]);

  // This component doesn't render anything visible
  return null;
};

export default SecurityMonitor;
