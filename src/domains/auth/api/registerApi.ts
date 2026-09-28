// Thin fetch wrapper for STORY-044 (Tenant self-registration page) — mirrors
// ai-ui/src/domains/catalog/api/catalogApi.ts's exact shape (`${API_BASE}/...`,
// explicitly-typed envelope unwrap). `POST /tenants` is public (`@Public()`
// decorator, ai-backend/src/tenants/tenants.controller.ts) — no
// `credentials: 'include'` is needed for it to succeed, but it's kept
// anyway for consistency with every other call in this codebase and
// because it's harmless (no cookie exists yet at this point regardless).
//
// IMPORTANT (PRD §2/§7, verified by reading TenantsService.register()
// directly): this endpoint creates ONLY the Tenant row. It never creates a
// first owner user. Callers of registerTenant() must not imply a working
// login exists right after this resolves.

const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

export class RegisterApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'RegisterApiError';
  }
}

export interface TenantResponse {
  tenantId: number;
  name: string;
  vertical: string;
  currency: string;
  batchExpiryTrackingEnabled: boolean;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

// Deliberately omits vertical/currency (PRD §2/§7 scope cut) — this product
// is pharmacy-only for now, so the backend's own defaults (`pharmacy`/`NPR`)
// apply silently rather than exposing a picker that implies otherwise.
export async function registerTenant(name: string): Promise<TenantResponse> {
  const res = await fetch(`${API_BASE}/tenants`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const errJson = (await res.json()) as { message?: string | string[] };
      if (errJson.message) {
        message = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
      }
    } catch {
      // response had no JSON body — fall back to the generic message
    }
    throw new RegisterApiError(res.status, message);
  }
  const json = (await res.json()) as { success: boolean; data: TenantResponse };
  return json.data;
}
