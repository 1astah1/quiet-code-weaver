import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/toast';
import { secureAuditLog, SecurityValidator } from '@/utils/securityValidation';

// Безопасный хук аутентификации с дополнительными проверками
export const useSecureAuth = () => {
  console.log('🔐 [SECURE_AUTH] Hook mounting/rendering');
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSecurityVerified, setIsSecurityVerified] = useState(false);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const { toast } = useToast();

  // Базовая аутентификация
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('❌ [SECURE_AUTH] Auth error:', error);
          setUser(null);
        } else {
          console.log('✅ [SECURE_AUTH] User loaded:', currentUser?.id);
          setUser(currentUser);
        }
      } catch (error) {
        console.error('💥 [SECURE_AUTH] Unexpected auth error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getCurrentUser();

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [SECURE_AUTH] Auth state changed:', event, session?.user?.id);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Функция выхода
  const signOut = async () => {
    try {
      console.log('🚪 [SECURE_AUTH] Signing out user:', user?.id);
      await supabase.auth.signOut();
      setUser(null);
      setIsSecurityVerified(false);
      setSecurityWarnings([]);
    } catch (error) {
      console.error('❌ [SECURE_AUTH] Sign out error:', error);
      toast({
        title: "Ошибка выхода",
        description: "Не удалось выйти из системы",
        variant: "destructive",
      });
    }
  };

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
    securityWarnings,
    signOut
  };
};
