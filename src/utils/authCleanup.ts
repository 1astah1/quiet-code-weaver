
export const cleanupAuthState = () => {
  try {
    // Очищаем все ключи связанные с Supabase auth
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Очищаем sessionStorage если используется
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    
    console.log('🧹 Auth state cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning auth state:', error);
  }
};
