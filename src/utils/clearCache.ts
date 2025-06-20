
export const clearAllCache = () => {
  console.log('🧹 Starting cache cleanup...');
  
  try {
    // Очищаем localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.startsWith('supabase') || key.includes('sb-') || key.startsWith('auth')) {
        localStorage.removeItem(key);
        console.log('🗑️ Removed from localStorage:', key);
      }
    });
    
    // Очищаем sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (key.startsWith('supabase') || key.includes('sb-') || key.startsWith('auth')) {
        sessionStorage.removeItem(key);
        console.log('🗑️ Removed from sessionStorage:', key);
      }
    });
    
    console.log('✅ Cache cleanup completed');
  } catch (error) {
    console.error('❌ Error during cache cleanup:', error);
  }
};
