/**
 * Centralized authentication utilities
 * NOTE: This is a temporary solution using localStorage
 * For production, implement proper JWT/session management with httpOnly cookies
 */

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff';
  staffId?: string;
  isActive: boolean;
}

/**
 * Logout function - clears user session and redirects to login
 */
export function handleLogout() {
  // Clear all auth-related data
  localStorage.removeItem('crm_user');
  localStorage.removeItem('crm_session_timestamp');
  sessionStorage.clear();

  // Redirect to login
  window.location.href = '/login';
}

/**
 * Get current logged in user from localStorage with validation
 */
export function getCurrentUser(): User | null {
  try {
    const userData = localStorage.getItem('crm_user');
    if (!userData) {
      return null;
    }

    const user = JSON.parse(userData);

    // Basic validation
    if (!user || !user._id || !user.email || !user.role) {
      console.error('Invalid user data format');
      handleLogout();
      return null;
    }

    // Check if user is active
    if (!user.isActive) {
      console.error('User account is inactive');
      handleLogout();
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error parsing user data:', error);
    handleLogout();
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getCurrentUser();
}

/**
 * Set user session with timestamp
 */
export function setUserSession(user: User): void {
  // Store user data
  localStorage.setItem('crm_user', JSON.stringify(user));
  localStorage.setItem('crm_session_timestamp', Date.now().toString());
}

/**
 * Check if user has required role
 */
export function hasRole(user: User | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export function requireAuth(): User | null {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  return user;
}

/**
 * Require specific role - redirect if user doesn't have required role
 */
export function requireRole(user: User | null, allowedRoles: string[]): User | null {
  if (!user || !hasRole(user, allowedRoles)) {
    window.location.href = '/login';
    return null;
  }
  return user;
}

/**
 * Get session age in milliseconds
 */
export function getSessionAge(): number | null {
  const timestamp = localStorage.getItem('crm_session_timestamp');
  if (!timestamp) return null;
  return Date.now() - parseInt(timestamp);
}

/**
 * Check if session is expired (24 hours)
 */
export function isSessionExpired(): boolean {
  const age = getSessionAge();
  if (age === null) return true;
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  return age > SESSION_DURATION;
}

/**
 * Validate session - logout if expired
 */
export function validateSession(): boolean {
  if (isSessionExpired()) {
    handleLogout();
    return false;
  }
  return true;
}

/**
 * Get display name for user role
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    'super_admin': 'Super Admin',
    'manager': 'Manager',
    'staff': 'Staff',
  };
  return roleNames[role] || role;
}

/**
 * Check if user can access admin features
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, ['super_admin', 'manager']);
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: User | null): boolean {
  return hasRole(user, ['super_admin']);
}

