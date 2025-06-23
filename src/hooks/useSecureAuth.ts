
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { secureAuditLog, SecurityValidator } from '@/utils/securityValidation';

// Безопасный хук аутентификации с дополнительными проверками
export const useSecureAuth = () => {
  console.log('🔐 [SECURE_AUTH] Hook mounting/rendering');
  
  const { user, isLoading } = useAuth();
  const [isSecurityVerified, setIsSecurityVerified] = useState(false);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  console.log('📊 [SECURE_AUTH] Current state:', {
    hasUser: !!user,
    userId: user?.id,
    isLoading,
    isSecurityVerified,
    warningsCount: securityWarnings.length
  });

  useEffect(() => {
    if (!user) {
      console.log('❌ [SECURE_AUTH] No user, resetting security state');
      setIsSecurityVerified(false);
      return;
    }

    console.log('🔍 [SECURE_AUTH] Starting security verification for user:', user.id);

    const verifyUserSecurity = async () => {
      try {
        const warnings: string[] = [];

        // Проверка валидности ID пользователя
        if (!SecurityValidator.validateUUID(user.id)) {
          console.error('🚨 [SECURE_AUTH] Invalid user ID format:', user.id);
          warnings.push('Некорректный формат ID пользователя');
          await secureAuditLog(user.id, 'invalid_user_id', {}, false, 'high');
        }

        // Проверка на подозрительную активность сессии
        const sessionStart = sessionStorage.getItem('session_start');
        if (!sessionStart) {
          console.log('🔄 [SECURE_AUTH] Setting new session start time');
          sessionStorage.setItem('session_start', Date.now().toString());
        } else {
          const sessionDuration = Date.now() - parseInt(sessionStart);
          console.log('⏱️ [SECURE_AUTH] Session duration check:', {
            sessionStart,
            currentTime: Date.now(),
            duration: sessionDuration,
            durationHours: sessionDuration / (60 * 60 * 1000)
          });
          
          if (sessionDuration > 24 * 60 * 60 * 1000) { // Более 24 часов
            console.warn('⚠️ [SECURE_AUTH] Long session detected:', sessionDuration);
            warnings.push('Подозрительно долгая сессия');
            await secureAuditLog(user.id, 'long_session_detected', { duration: sessionDuration }, true, 'medium');
          }
        }

        console.log('📊 [SECURE_AUTH] Security verification results:', {
          warningsCount: warnings.length,
          warnings,
          isVerified: warnings.length === 0
        });

        setSecurityWarnings(warnings);
        setIsSecurityVerified(warnings.length === 0);

        if (warnings.length === 0) {
          console.log('✅ [SECURE_AUTH] Security verification passed');
          await secureAuditLog(user.id, 'security_verification_passed', {});
        } else {
          console.warn('⚠️ [SECURE_AUTH] Security verification failed with warnings:', warnings);
        }
      } catch (error) {
        console.error('💥 [SECURE_AUTH] Security verification error:', error);
        setSecurityWarnings(['Ошибка проверки безопасности']);
        setIsSecurityVerified(false);
      }
    };

    verifyUserSecurity();
  }, [user]);

  console.log('🔐 [SECURE_AUTH] Hook returning:', {
    hasUser: !!user,
    isLoading,
    isSecurityVerified,
    securityWarnings: securityWarnings.length
  });

  return {
    user,
    isLoading,
    isSecurityVerified,
    securityWarnings
  };
};
