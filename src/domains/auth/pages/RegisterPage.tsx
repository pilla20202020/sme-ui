import { useState, type FormEvent } from 'react';
import { RegisterApiError, registerTenant } from '@/domains/auth/api/registerApi';

interface RegisterPageProps {
  onBackToLogin: () => void;
}

// STORY-044 — public tenant self-registration. Rendered by LoginPage as a
// toggled view (PRD §2/§5: "a link/toggle from LoginPage into a
// registration view" — developer's choice of mechanism, this is the one
// picked here) so it stays reachable pre-login without touching
// AuthContext/AuthGate/routeConfig at all: LoginPage itself already
// renders outside any session check.
export function RegisterPage({ onBackToLogin }: RegisterPageProps) {
  const [businessName, setBusinessName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const tenant = await registerTenant(businessName.trim());
      setCreatedName(tenant.name);
    } catch (err) {
      setError(
        err instanceof RegisterApiError
          ? err.message
          : 'Unable to register right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 380,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 32,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    marginBottom: 16,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box',
  };

  // Success state — this MVP's registration creates only the Tenant row,
  // never a first owner user (PRD §5/§7, confirmed by reading
  // TenantsService.register() directly: no user-creation logic exists
  // there at all). The message below must not imply a working login now
  // exists — that is the single most important thing this screen must not
  // get wrong.
  if (createdName) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: '#0567bc' }}>AI SME</div>
        </div>
        <div
          role="status"
          style={{
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <strong>Account created</strong> for &quot;{createdName}&quot; — an owner login will need
          to be set up separately. This registration only creates the business record; a staff
          member with access can invite the first owner from the Staff screen once one exists, or
          contact support to get your first login set up.
        </div>
        <button
          type="button"
          onClick={onBackToLogin}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: '#0567bc',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: '#0567bc' }}>AI SME</div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Register your pharmacy</div>
      </div>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="register-business-name"
          style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
        >
          Business name
        </label>
        <input
          id="register-business-name"
          type="text"
          required
          minLength={2}
          maxLength={255}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          disabled={submitting}
          style={inputStyle}
          placeholder="e.g. Kathmandu Pharmacy"
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
            marginBottom: 12,
          }}
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <button
        type="button"
        onClick={onBackToLogin}
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
        }}
      >
        Already have an account? Sign in
      </button>
    </div>
  );
}

export default RegisterPage;
