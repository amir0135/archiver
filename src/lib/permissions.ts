export type UserRole = 'user' | 'admin' | 'manager';

interface Permissions {
  canCreateFiles: boolean;
  canDeleteFiles: boolean;
  canShareFiles: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canAccessSettings: boolean;
}

export const rolePermissions: Record<UserRole, Permissions> = {
  user: {
    canCreateFiles: true,
    canDeleteFiles: true,
    canShareFiles: true,
    canManageUsers: false,
    canViewAnalytics: false,
    canAccessSettings: false,
  },
  manager: {
    canCreateFiles: true,
    canDeleteFiles: true,
    canShareFiles: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canAccessSettings: true,
  },
  admin: {
    canCreateFiles: true,
    canDeleteFiles: true,
    canShareFiles: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canAccessSettings: true,
  },
};

export function getUserPermissions(role: UserRole): Permissions {
  return rolePermissions[role] || rolePermissions.user;
}

export function hasPermission(role: UserRole, permission: keyof Permissions): boolean {
  const permissions = getUserPermissions(role);
  return permissions[permission] || false;
}