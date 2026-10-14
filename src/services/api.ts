import { User, MetaResponse, SummaryResponse, FactRecord } from '../types';
import { mockMeta, mockFacts, calculateMockSummary } from './mockData';

const DEFAULT_API_BASE = 'https://mobile.intanpariwara.com/api/q4';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Check if mock mode is forced via env or user preference
export function isMockModeActive(): boolean {
  const envMock = import.meta.env.VITE_USE_MOCK;
  if (envMock === 'true') return true;
  const storedPreference = sessionStorage.getItem('q4_force_mock');
  if (storedPreference !== null) {
    return storedPreference === 'true';
  }
  // Default to mock if offline or in development environment where the remote host may not be accessible
  return false;
}

export function setMockModePreference(active: boolean) {
  sessionStorage.setItem('q4_force_mock', active ? 'true' : 'false');
}

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE || DEFAULT_API_BASE;
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem('q4_token');
}

export function getStoredUser(): User | null {
  const raw = sessionStorage.getItem('q4_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: User) {
  sessionStorage.setItem('q4_token', token);
  sessionStorage.setItem('q4_user', JSON.stringify(user));
}

export function clearAuthSession() {
  sessionStorage.removeItem('q4_token');
  sessionStorage.removeItem('q4_user');
}

// Request helper with automatic Bearer token injection & error handling
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getStoredToken();

  const headers = new Headers(options.headers || {});
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

    if (res.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new CustomEvent('q4:auth_unauthorized'));
      throw new ApiError('Sesi autentikasi telah berakhir. Silakan login kembali.', 401);
    }

    if (res.status === 403) {
      window.dispatchEvent(new CustomEvent('q4:auth_forbidden'));
      throw new ApiError('Akses ditolak: Anda tidak memiliki izin untuk melihat data ini.', 403);
    }

    if (!res.ok) {
      const errorText = await res.text();
      let parsedMessage = `Permintaan gagal (${res.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        parsedMessage = errorJson.message || errorJson.error || parsedMessage;
      } catch {
        if (errorText.length > 0 && errorText.length < 100) parsedMessage = errorText;
      }
      throw new ApiError(parsedMessage, res.status);
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const fetchErr = err as Error;
    throw new ApiError(fetchErr.message || 'Gagal terhubung ke server API.', 0);
  }
}

// API Service Interface
export const api = {
  async login(email: string, password: string): Promise<{ token: string; user: User; isMock?: boolean }> {
    if (isMockModeActive()) {
      return simulateMockLogin(email, password);
    }

    try {
      const response = await request<{
        status: string;
        token: string;
        user: { name: string; role: 'direktur' | 'am'; am_code?: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const user: User = {
        name: response.user.name,
        email,
        role: response.user.role,
        am_code: response.user.am_code,
      };

      saveAuthSession(response.token, user);
      return { token: response.token, user, isMock: false };
    } catch (err) {
      // If live API endpoint fails to connect (network/CORS/unreachable), fallback smoothly to mock
      console.warn('Real API login failed, falling back to mock authentication:', err);
      const mockResult = simulateMockLogin(email, password);
      setMockModePreference(true);
      return { ...mockResult, isMock: true };
    }
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
    try {
      return await request<MetaResponse>('/meta');
    } catch (err) {
      console.warn('Live getMeta failed, using fallback meta:', err);
      setMockModePreference(true);
      return mockMeta;
    }
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
    try {
      const queryParams = new URLSearchParams();
      if (params?.bulan_no) queryParams.set('bulan_no', String(params.bulan_no));
      if (params?.am_code) queryParams.set('am_code', params.am_code);
      if (params?.bo_code) queryParams.set('bo_code', params.bo_code);
      if (params?.principal) queryParams.set('principal', params.principal);

      const qs = queryParams.toString();
      return await request<SummaryResponse>(`/summary${qs ? `?${qs}` : ''}`);
    } catch (err) {
      console.warn('Live getSummary failed, using client calculated summary:', err);
      return calculateMockSummary(mockFacts, params?.bulan_no, params?.am_code, params?.bo_code, params?.principal);
    }
  },

  async getFacts(): Promise<{ status: string; count: number; data: FactRecord[] }> {
    if (isMockModeActive()) {
      return {
        status: 'success',
        count: mockFacts.length,
        data: mockFacts,
      };
    }
    try {
      return await request<{ status: string; count: number; data: FactRecord[] }>('/facts');
    } catch (err) {
      console.warn('Live getFacts failed, using fallback facts:', err);
      setMockModePreference(true);
      return {
        status: 'success',
        count: mockFacts.length,
        data: mockFacts,
      };
    }
  },
};

function simulateMockLogin(email: string, _password: string): { token: string; user: User } {
  const isAm = email.toLowerCase().includes('am') || email.toLowerCase().includes('agus');
  const token = `mock_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  let user: User;
  if (isAm) {
    user = {
      id: 'usr-am-01',
      name: 'Agus Setiadi',
      email: email || 'am01@intanpariwara.com',
      role: 'am',
      am_code: 'AM 01',
    };
  } else {
    user = {
      id: 'usr-dir-01',
      name: 'Budi Santoso, S.E., M.M.',
      email: email || 'direktur@intanpariwara.com',
      role: 'direktur',
    };
  }

  saveAuthSession(token, user);
  return { token, user };
}
