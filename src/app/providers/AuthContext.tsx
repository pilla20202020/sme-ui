import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import type { AuthStatus, SsoUser, AuthMeResponse } from '@/domains/auth/types/auth';
import {
  ApiError,
  destroySession,
  fetchAuthMe,
  loginWithPassword,
} from '@/domains/auth/api/authApi';
import { LoginPage } from '@/domains/auth/pages/LoginPage';

interface AuthContextValue {
  status: AuthStatus;
  user: SsoUser | null;
  tenantId: number | null;
  tenantName: string | null;
  roles: string[];
  permissions: string[];
  errorMessage: string | null;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applyProfile(
  meData: AuthMeResponse,
  setUser: (u: SsoUser) => void,
  setRoles: (r: string[]) => void,
  setPermissions: (p: string[]) => void,
  setTenantId: (t: number | null) => void,
  setTenantName: (t: string | null) => void
) {
  setUser({
    id: meData.userId,
    email: meData.email,
    firstName: meData.firstName,
    lastName: meData.lastName,
  });
  setRoles(meData.roles);
  setPermissions(meData.permissions);
  setTenantId(meData.tenantId);
  setTenantName(meData.tenantName);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<SsoUser | null>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      // Member portal routes use their own token-based auth — skip the
      // staff/owner login gate entirely.
      if (window.location.pathname.startsWith('/member-portal')) {
        if (!cancelled) setStatus('authenticated');
        return;
      }

      try {
        // Page reload / return visit: resume the session via the existing
        // httpOnly cookie (STORY-005 local login) if there is one.
        const meData = await fetchAuthMe();
        if (cancelled) return;

        applyProfile(meData, setUser, setRoles, setPermissions, setTenantId, setTenantName);
        setStatus('authenticated');
        setErrorMessage(null);
      } catch (err) {
        if (cancelled) return;

        setUser(null);
        setTenantId(null);
        setTenantName(null);
        setRoles([]);
        setPermissions([]);

        // A server error (5xx) means the backend itself is failing — surface
        // that distinctly rather than just showing the login form, since
        // re-submitting credentials would not help.
        if (err instanceof ApiError && err.status >= 500) {
          setStatus('error');
          setErrorMessage(
            'Sign-in failed due to a server error. Please try again later or contact support.'
          );
          return;
        }

        // No valid session (401, or no cookie at all) — show the login form.
        setStatus('unauthenticated');
      }
    }

    void checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const meData = await loginWithPassword(email, password);
    applyProfile(meData, setUser, setRoles, setPermissions, setTenantId, setTenantName);
    setStatus('authenticated');
    setErrorMessage(null);
  }, []);

  const logout = useCallback(() => {
    void destroySession().finally(() => {
      setUser(null);
      setTenantId(null);
      setTenantName(null);
      setRoles([]);
      setPermissions([]);
      setErrorMessage(null);
      setStatus('unauthenticated');
    });
  }, []);

  const hasRole = useCallback((role: string) => roles.includes(role), [roles]);
  const hasPermission = useCallback((perm: string) => permissions.includes(perm), [permissions]);
  const hasAnyRole = useCallback(
    (...r: string[]) => r.some((role) => roles.includes(role)),
    [roles]
  );
  const hasAllPermissions = useCallback(
    (...p: string[]) => p.every((perm) => permissions.includes(perm)),
    [permissions]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      tenantId,
      tenantName,
      roles,
      permissions,
      errorMessage,
      hasRole,
      hasPermission,
      hasAnyRole,
      hasAllPermissions,
      login,
      logout,
    }),
    [
      status,
      user,
      tenantId,
      tenantName,
      roles,
      permissions,
      errorMessage,
      hasRole,
      hasPermission,
      hasAnyRole,
      hasAllPermissions,
      login,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { status, errorMessage } = useAuth();
  const location = useLocation();

  // Member portal routes use their own token-based auth flow — skip the gate.
  if (location.pathname.startsWith('/member-portal')) {
    return <>{children}</>;
  }

  if (status === 'checking') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              margin: '0 auto 16px',
              border: '3px solid #0567bc',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'auth-gate-spin 0.8s linear infinite',
            }}
          />
          <div style={{ fontWeight: 700, fontSize: 20 }}>Signing you in...</div>
        </div>
        <style>{`
          @keyframes auth-gate-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <LoginPage />;
  }

  if (status === 'error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f8fafc',
          color: '#0f172a',
          padding: 20,
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: '100%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Sign-in error</h2>
          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14, color: '#475569' }}>
            {errorMessage ?? 'Sign-in cannot continue right now.'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
