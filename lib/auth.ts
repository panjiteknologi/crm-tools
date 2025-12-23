/**
 * Centralized authentication utilities
 */

/**
 * Logout function - clears user session and redirects to login
 */
export function handleLogout() {
  localStorage.removeItem('crm_user');
  window.location.href = '/login';
}

/**
 * Get current logged in user from localStorage
 */
export function getCurrentUser() {
  try {
    const userData = localStorage.getItem('crm_user');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getCurrentUser();
}

/**
 * Set user session
 */
export function setUserSession(user: any) {
  localStorage.setItem('crm_user', JSON.stringify(user));
}
