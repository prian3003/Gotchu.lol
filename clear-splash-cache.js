// Run this in browser console to clear splash screen cache
// This will make splash screens show again

// Clear all splash-related localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('splash') || key.includes('profile_splash')) {
    localStorage.removeItem(key);
  }
});

// Clear all splash-related sessionStorage
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('splash') || key.includes('profile_splash')) {
    sessionStorage.removeItem(key);
  }
});

