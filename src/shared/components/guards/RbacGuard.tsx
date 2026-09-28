import type { ReactNode } from 'react';
import { usePermissions } from '@/shared/hooks/usePermissions';

interface RequireRoleProps {
  role: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequireRole({ role, fallback = null, children }: RequireRoleProps) {
  const { hasAnyRole } = usePermissions();
  const roles = Array.isArray(role) ? role : [role];

  if (!hasAnyRole(...roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RequirePermissionProps {
  permission: string | string[];
  all?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequirePermission({
  permission,
  all = true,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { hasPermission, hasAllPermissions } = usePermissions();
  const perms = Array.isArray(permission) ? permission : [permission];

  const authorized = all
    ? hasAllPermissions(...perms)
    : perms.some((p) => hasPermission(p));

  if (!authorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}



