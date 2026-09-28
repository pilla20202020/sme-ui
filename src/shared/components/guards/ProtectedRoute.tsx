import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/shared/hooks/usePermissions';
const UNAUTHORIZED_ROUTE = '/unauthorized';

interface ProtectedRouteProps {
  permission?: string;
  role?: string | string[];
  children: ReactNode;
}

export function ProtectedRoute({ permission, role, children }: ProtectedRouteProps) {
  const { hasPermission, hasAnyRole } = usePermissions();

  if (permission && !hasPermission(permission)) {
    return <Navigate to={UNAUTHORIZED_ROUTE} replace />;
  }

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!hasAnyRole(...roles)) {
      return <Navigate to={UNAUTHORIZED_ROUTE} replace />;
    }
  }

  return <>{children}</>;
}



