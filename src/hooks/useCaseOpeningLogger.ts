
import { supabase } from "@/integrations/supabase/client";

interface CaseOpeningLog {
  user_id: string;
  case_id: string;
  case_name: string;
  is_free: boolean;
  phase: 'opening' | 'revealing' | 'bonus' | 'complete' | 'error';
  reward_type?: 'skin' | 'coin_reward';
  reward_data?: any;
  error_message?: string;
  duration_ms?: number;
}

export const useCaseOpeningLogger = () => {
  const logCaseOpening = async (logData: CaseOpeningLog) => {
    try {
      console.log('🎰 [CASE_OPENING_LOG]', logData);
      
      // Записываем в security_audit_log для отслеживания
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: logData.user_id,
          action: 'case_opening',
          details: {
            case_id: logData.case_id,
            case_name: logData.case_name,
            is_free: logData.is_free,
            phase: logData.phase,
            reward_type: logData.reward_type,
            reward_data: logData.reward_data,
            error_message: logData.error_message,
            duration_ms: logData.duration_ms,
            timestamp: new Date().toISOString()
          },
          success: !logData.error_message
        });
    } catch (error) {
      console.error('❌ [CASE_OPENING_LOG] Failed to log:', error);
    }
  };

  return { logCaseOpening };
};
