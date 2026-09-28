import { useState, type FormEvent } from 'react';
import { useAuth } from '@/app/providers/AuthContext';
import { ApiError } from '@/domains/auth/api/authApi';
import { RegisterPage } from './RegisterPage';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // STORY-044: toggles this same pre-login surface into the public
  // registration view — chosen over a dedicated AuthGate-special-cased
  // route (PRD §2/§5's other listed option) since LoginPage is already
  // rendered with no session required, so no AuthContext/AuthGate/
  // routeConfig changes are needed to make registration reachable.
  const [mode, setMode] = useState<'login' | 'register'>('login');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Unable to sign in right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === 'register') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          padding: 20,
        }}
      >
        <RegisterPage onBackToLogin={() => setMode('login')} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: '#0567bc' }}>AI SME</div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Sign in to your pharmacy account
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="login-email"
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: 16,
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />

          <label
            htmlFor="login-password"
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: 20,
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <div
              role="alert"
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: submitting ? '#94c3e6' : '#0567bc',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode('register')}
          disabled={submitting}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            color: '#0567bc',
            fontSize: 13,
            fontWeight: 600,
            cursor: submitting ? 'default' : 'pointer',
            padding: 0,
            marginTop: 16,
          }}
        >
          Don&apos;t have an account? Register your pharmacy
        </button>
      </div>
    </div>
  );
}
