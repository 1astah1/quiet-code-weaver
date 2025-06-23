
import { supabase } from '@/integrations/supabase/client';

interface CaseOpeningLog {
  user_id: string;
  case_id: string;
  case_name: string;
  is_free: boolean;
  phase: 'opening' | 'revealing' | 'complete' | 'error';
  reward_type?: string;
  reward_data?: any;
  duration_ms?: number;
  error_message?: string;
}

export const useCaseOpeningLogger = () => {
  const logCaseOpening = async (logData: CaseOpeningLog) => {
    try {
      console.log('📝 [CASE_OPENING_LOG]', logData);
      
      // Since we don't have security_audit_log table, just log to console for now
      // This prevents the TypeScript error while maintaining logging functionality
      
    } catch (error) {
      console.error('Failed to log case opening:', error);
    }
  };

  return { logCaseOpening };
};
