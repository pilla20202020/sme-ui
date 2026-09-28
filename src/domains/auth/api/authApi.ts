import type { SsoUser, AuthMeResponse } from '@/domains/auth/types/auth';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const TOKEN_PARAM = 'token';
const API_BASE = import.meta.env.VITE_API_BASE_URL_V1 ?? '/api';

interface SsoConfig {
  loginUrl: string;
  logoutUrl: string;
  siteKey: string;
  userInfoUrl: string;
}

export function getSsoConfig(): SsoConfig {
  return {
    loginUrl: import.meta.env.VITE_SSO_LOGIN_URL ?? '',
    logoutUrl: import.meta.env.VITE_SSO_LOGOUT_URL ?? '',
    siteKey: import.meta.env.VITE_SSO_SITE_KEY ?? '',
    userInfoUrl: import.meta.env.VITE_SSO_USER_INFO_URL ?? '',
  };
}

export function getTokenFromUrl(url = window.location.href): string {
  return new URL(url).searchParams.get(TOKEN_PARAM) ?? '';
}

export function clearTokenFromUrl(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(TOKEN_PARAM)) return;
  url.searchParams.delete(TOKEN_PARAM);
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

export function buildSsoLoginUrl(config: SsoConfig): string {
  if (!config.loginUrl) return '';

  if (!config.siteKey) return config.loginUrl;

  try {
    const loginUri = new URL(config.loginUrl);
    loginUri.searchParams.set('site_key', config.siteKey);
    return loginUri.toString();
  } catch {
    const queryPrefix = config.loginUrl.includes('?') ? '&' : '?';
    return `${config.loginUrl}${queryPrefix}site_key=${encodeURIComponent(config.siteKey)}`;
  }
}

export function buildSsoLogoutUrl(config: SsoConfig): string {
  if (config.logoutUrl) {
    if (!config.siteKey) return config.logoutUrl;

    try {
      const logoutUri = new URL(config.logoutUrl);
      logoutUri.searchParams.set('site_key', config.siteKey);
      return logoutUri.toString();
    } catch {
      const queryPrefix = config.logoutUrl.includes('?') ? '&' : '?';
      return `${config.logoutUrl}${queryPrefix}site_key=${encodeURIComponent(config.siteKey)}`;
    }
  }

  return config.loginUrl || '';
}

export function redirectToSsoLogin(config = getSsoConfig()): boolean {
  const loginUrl = buildSsoLoginUrl(config);
  if (!loginUrl) return false;
  window.location.replace(loginUrl);
  return true;
}

export function redirectToSsoLogout(config = getSsoConfig()): boolean {
  const logoutUrl = buildSsoLogoutUrl(config);
  if (!logoutUrl) return false;
  window.location.replace(logoutUrl);
  return true;
}

export async function createSession(accessToken: string): Promise<AuthMeResponse> {
  const response = await fetch(`${API_BASE}/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (!response.ok) {
    throw new ApiError(response.status, `Session creation failed: ${response.status}`);
  }
  const json = (await response.json()) as { success: boolean; data: AuthMeResponse };
  return json.data;
}

export async function destroySession(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function loginWithPassword(email: string, password: string): Promise<AuthMeResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError(response.status, 'Invalid email or password');
    }
    throw new ApiError(response.status, `Login failed: ${response.status}`);
  }
  const json = (await response.json()) as { success: boolean; data: AuthMeResponse };
  return json.data;
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }
  const json = (await response.json()) as { success: boolean; data: AuthMeResponse };
  return json.data;
}

/** @deprecated Use createSession instead. Kept for SSO user-info validation if needed. */
export async function fetchSsoUserInfo(token: string, config = getSsoConfig()): Promise<SsoUser> {
  if (!config.userInfoUrl) {
    throw new Error('VITE_SSO_USER_INFO_URL is missing');
  }

  const response = await fetch(config.userInfoUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(config.siteKey ? { SiteKey: config.siteKey } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to validate SSO token: ${response.status}`);
  }

  const payload = (await response.json()) as { user?: SsoUser; data?: SsoUser } | SsoUser;
  const user =
    (payload as { user?: SsoUser }).user ??
    (payload as { data?: SsoUser }).data ??
    (payload as SsoUser);

  if (!user || typeof user !== 'object' || Array.isArray(user)) {
    throw new Error('Invalid SSO user response');
  }

  if (!user.id && !user.sso_user_id && !user.email) {
    throw new Error('SSO response missing required identity fields');
  }

  return { ...user, access_token: user.access_token ?? token };
}
