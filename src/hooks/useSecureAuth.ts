
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { secureAuditLog, SecurityValidator } from '@/utils/securityValidation';

// Безопасный хук аутентификации с дополнительными проверками
export const useSecureAuth = () => {
  const { user, isLoading } = useAuth();
  const [isSecurityVerified, setIsSecurityVerified] = useState(false);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setIsSecurityVerified(false);
      return;
    }

    const verifyUserSecurity = async () => {
      const warnings: string[] = [];

      // Проверка валидности ID пользователя
      if (!SecurityValidator.validateUUID(user.id)) {
        warnings.push('Некорректный формат ID пользователя');
        await secureAuditLog(user.id, 'invalid_user_id', {}, false, 'high');
      }

      // Проверка на подозрительную активность сессии
      const sessionStart = sessionStorage.getItem('session_start');
      if (!sessionStart) {
        sessionStorage.setItem('session_start', Date.now().toString());
      } else {
        const sessionDuration = Date.now() - parseInt(sessionStart);
        if (sessionDuration > 24 * 60 * 60 * 1000) { // Более 24 часов
          warnings.push('Подозрительно долгая сессия');
          await secureAuditLog(user.id, 'long_session_detected', { duration: sessionDuration }, true, 'medium');
        }
      }

      setSecurityWarnings(warnings);
      setIsSecurityVerified(warnings.length === 0);

      if (warnings.length === 0) {
        await secureAuditLog(user.id, 'security_verification_passed', {});
      }
    };

    verifyUserSecurity();
  }, [user]);

  return {
    user,
    isLoading,
    isSecurityVerified,
    securityWarnings
  };
};
