import { useAuth } from '@/app/providers/AuthContext';

export function usePermissions() {
  const { roles, permissions, hasRole, hasPermission, hasAnyRole, hasAllPermissions } = useAuth();

  return {
    roles,
    permissions,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllPermissions,
    isAdmin: hasRole('admin'),
    isUnderwriter: hasAnyRole('admin', 'underwriter'),
    isViewer: hasAnyRole('admin', 'underwriter', 'viewer'),
  };
}



