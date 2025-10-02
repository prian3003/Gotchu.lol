// Run this in browser console to clear splash screen cache
// This will make splash screens show again

// Clear all splash-related localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('splash') || key.includes('profile_splash')) {
    console.log('Removing:', key, localStorage.getItem(key));
    localStorage.removeItem(key);
  }
});

// Clear all splash-related sessionStorage
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('splash') || key.includes('profile_splash')) {
    console.log('Removing session:', key, sessionStorage.getItem(key));
    sessionStorage.removeItem(key);
  }
});

console.log('✅ All splash screen caches cleared!');
console.log('🔄 Refresh the page to see splash screens again');