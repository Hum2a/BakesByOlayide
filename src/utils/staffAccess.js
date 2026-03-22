/**
 * True for admin or developer accounts (boolean flags and optional role string).
 */
export function hasStaffAccess(userData) {
  if (!userData) return false;
  if (userData.isAdmin || userData.isDeveloper) return true;
  const role = userData.role;
  return role === 'admin' || role === 'developer';
}
