export interface SsoUser {
  id?: string | number;
  sso_user_id?: string | number;
  email?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  access_token?: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthMeResponse {
  userId: number;
  sub: string;
  /** Null for platform-admin/support accounts not scoped to a tenant. */
  tenantId: number | null;
  /** Null whenever tenantId is null, for the same reason. */
  tenantName: string | null;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}
