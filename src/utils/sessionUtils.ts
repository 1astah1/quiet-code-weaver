
// Утилиты для работы с сессиями открытия кейсов
export const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getStoredSessionId = (userId: string, caseId: string): string | null => {
  try {
    const key = `case-session-${userId}-${caseId}`;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const storeSessionId = (userId: string, caseId: string, sessionId: string): void => {
  try {
    const key = `case-session-${userId}-${caseId}`;
    localStorage.setItem(key, sessionId);
    
    // Очищаем через 10 минут
    setTimeout(() => {
      localStorage.removeItem(key);
    }, 10 * 60 * 1000);
  } catch {
    // Игнорируем ошибки localStorage
  }
};

export const clearSessionId = (userId: string, caseId: string): void => {
  try {
    const key = `case-session-${userId}-${caseId}`;
    localStorage.removeItem(key);
  } catch {
    // Игнорируем ошибки localStorage
  }
};
