import { User, MetaResponse, SummaryResponse, FactRecord } from '../types';
import { mockMeta, mockFacts, calculateMockSummary } from './mockData';

const DEFAULT_API_BASE = 'https://mobile.intanpariwara.com/api/q4';

export class ApiError extends Error {
  status: number;
  data?: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE || DEFAULT_API_BASE;
}

// Check if mock mode is forced via env or explicit user preference
export function isMockModeActive(): boolean {
  // If env explicitly says true, use mock
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return true;
  }
  // If user explicitly toggled mock in session
  const storedPreference = sessionStorage.getItem('q4_force_mock');
  if (storedPreference !== null) {
    return storedPreference === 'true';
  }
  // Default is LIVE API!
  return false;
}

export function setMockModePreference(active: boolean) {
  sessionStorage.setItem('q4_force_mock', active ? 'true' : 'false');
}

export function getStoredToken(): string | null {
  // Check localStorage first (for Remember Me sessions), then fall back to sessionStorage
  return localStorage.getItem('q4_token') || sessionStorage.getItem('q4_token');
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('q4_user') || sessionStorage.getItem('q4_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isRememberMeActive(): boolean {
  return localStorage.getItem('q4_remember_me') === 'true';
}

export function saveAuthSession(token: string, user: User, rememberMe = false, isMock = false) {
  if (rememberMe) {
    // Persistent across browser restarts
    localStorage.setItem('q4_token', token);
    localStorage.setItem('q4_user', JSON.stringify(user));
    localStorage.setItem('q4_remember_me', 'true');
    localStorage.setItem('q4_remembered_username', user.email || '');

    // Clear transient sessionStorage
    sessionStorage.removeItem('q4_token');
    sessionStorage.removeItem('q4_user');
  } else {
    // Session-only (wiped on tab/browser close)
    sessionStorage.setItem('q4_token', token);
    sessionStorage.setItem('q4_user', JSON.stringify(user));

    // Clear persistent token/user
    localStorage.removeItem('q4_token');
    localStorage.removeItem('q4_user');
    localStorage.removeItem('q4_remember_me');
  }
  setMockModePreference(isMock);
}

export function clearAuthSession() {
  // Remove authentication tokens and user payloads from both storages
  sessionStorage.removeItem('q4_token');
  sessionStorage.removeItem('q4_user');
  sessionStorage.removeItem('q4_force_mock');

  localStorage.removeItem('q4_token');
  localStorage.removeItem('q4_user');
  localStorage.removeItem('q4_remember_me');
  // Note: q4_remembered_username is kept so the username is preserved for convenience
}

// Check real server connectivity
export async function checkServerHealth(): Promise<{ online: boolean; message: string; baseUrl: string }> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/meta`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    // 401 is expected if no token provided, meaning server is alive and responding!
    if (res.status === 401 || res.status === 200) {
      return { online: true, message: 'Server Online & Merespons', baseUrl };
    }
    return { online: true, message: `Server Merespons (${res.status})`, baseUrl };
  } catch (err: unknown) {
    const fetchErr = err as Error;
    return {
      online: false,
      message: fetchErr.message || 'Tidak dapat terhubung ke server',
      baseUrl,
    };
  }
}

// Request helper with automatic Bearer token injection
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getStoredToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      let parsedMessage = `Permintaan gagal (HTTP ${res.status})`;
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(errorText);
        const obj = parsedJson as Record<string, string>;
        parsedMessage = obj.message || obj.error || parsedMessage;
      } catch {
        if (errorText.length > 0 && errorText.length < 150) parsedMessage = errorText;
      }

      if (res.status === 401) {
        if (!endpoint.includes('/auth/login')) {
          clearAuthSession();
          window.dispatchEvent(new CustomEvent('q4:auth_unauthorized'));
        }
        throw new ApiError(parsedMessage || 'Sesi autentikasi telah berakhir atau token tidak valid.', 401, parsedJson);
      }

      if (res.status === 403) {
        window.dispatchEvent(new CustomEvent('q4:auth_forbidden'));
        throw new ApiError(parsedMessage || 'Akses ditolak: Anda tidak memiliki wewenang untuk data ini.', 403, parsedJson);
      }

      throw new ApiError(parsedMessage, res.status, parsedJson);
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const fetchErr = err as Error;
    throw new ApiError(
      `Gagal terhubung ke API (${baseUrl}${endpoint}): ${fetchErr.message || 'Network error / CORS issue'}`,
      0
    );
  }
}

// API Service Interface
export const api = {
  // Real Login against live backend
  async login(email: string, password: string, rememberMe = false): Promise<{ token: string; user: User }> {
    const response = await request<{
      status: string;
      token: string;
      user: { name: string; role: 'direktur' | 'am'; am_code?: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });

    const user: User = {
      name: response.user?.name || email,
      email,
      role: response.user?.role || 'direktur',
      am_code: response.user?.am_code,
    };

    saveAuthSession(response.token, user, rememberMe, false);
    return { token: response.token, user };
  },

  // Login directly with a Bearer Token (useful for testing or SSO)
  loginWithToken(token: string, role: 'direktur' | 'am', amCode?: string, name?: string): { token: string; user: User } {
    const user: User = {
      name: name || (role === 'direktur' ? 'Direktur Penjualan' : `Area Manager (${amCode || 'AM 01'})`),
      email: role === 'direktur' ? 'direktur@intanpariwara.com' : 'am@intanpariwara.com',
      role,
      am_code: amCode,
    };

    saveAuthSession(token, user, false);
    return { token, user };
  },

  // Mock Login explicitly selected by user
  loginMock(role: 'direktur' | 'am', amCode = 'AM 01'): { token: string; user: User } {
    const token = `mock_token_${Date.now()}`;
    const user: User =
      role === 'direktur'
        ? {
            id: 'usr-dir-01',
            name: 'Budi Santoso, S.E., M.M.',
            email: 'direktur@intanpariwara.com',
            role: 'direktur',
          }
        : {
            id: 'usr-am-01',
            name: 'Agus Setiadi',
            email: 'am01@intanpariwara.com',
            role: 'am',
            am_code: amCode,
          };

    saveAuthSession(token, user, true);
    return { token, user };
  },

  async logout(): Promise<void> {
    const token = getStoredToken();
    if (token && !isMockModeActive()) {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch (err) {
        console.warn('Remote logout error:', err);
      }
    }
    clearAuthSession();
  },

  async getMeta(): Promise<MetaResponse> {
    if (isMockModeActive()) {
      return mockMeta;
    }
    return await request<MetaResponse>('/meta');
  },

  async getSummary(params?: {
    bulan_no?: number | null;
    am_code?: string | null;
    bo_code?: string | null;
    principal?: string | null;
  }): Promise<SummaryResponse> {
    if (isMockModeActive()) {
      return calculateMockSummary(mockFacts, params?.bulan_no, params?.am_code, params?.bo_code, params?.principal);
    }
    const queryParams = new URLSearchParams();
    if (params?.bulan_no) queryParams.set('bulan_no', String(params.bulan_no));
    if (params?.am_code) queryParams.set('am_code', params.am_code);
    if (params?.bo_code) queryParams.set('bo_code', params.bo_code);
    if (params?.principal) queryParams.set('principal', params.principal);

    const qs = queryParams.toString();
    return await request<SummaryResponse>(`/summary${qs ? `?${qs}` : ''}`);
  },

  async getFacts(): Promise<{ status: string; count: number; data: FactRecord[] }> {
    if (isMockModeActive()) {
      return {
        status: 'success',
        count: mockFacts.length,
        data: mockFacts,
      };
    }
    return await request<{ status: string; count: number; data: FactRecord[] }>('/facts');
  },
};
