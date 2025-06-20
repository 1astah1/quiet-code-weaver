
export const clearAllCache = () => {
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear any Supabase auth data specifically
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('supabase') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('supabase') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('All cache cleared');
};
