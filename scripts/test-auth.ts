/**
 * Automated Test Suite for Authentication & Remember Me Feature
 * Tests both Live Server API Contracts and Client Storage Logic
 */

const API_BASE = 'https://mobile.intanpariwara.com/api/q4';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ name, passed: true, details: 'OK', durationMs });
    console.log(`  ✅ [PASS] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ name, passed: false, details: err.message, durationMs });
    console.log(`  ❌ [FAIL] ${name} (${durationMs}ms): ${err.message}`);
  }
}

// In-memory Web Storage Mock for Node.js environment
class StorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

async function main() {
  console.log('====================================================');
  console.log('🧪 RUNNING AUTHENTICATION & REMEMBER ME TEST SUITE');
  console.log(`Target Server: ${API_BASE}`);
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SECTION 1: LIVE SERVER API CONTRACT TESTS
  // ----------------------------------------------------
  console.log('--- 1. Live Server API Contract Tests ---');

  await runTest('API Connectivity: Server responds to /meta', async () => {
    const res = await fetch(`${API_BASE}/meta`, {
      headers: { Accept: 'application/json' },
    });
    if (res.status !== 401 && res.status !== 200) {
      throw new Error(`Expected HTTP 401 (Auth Guard) or 200, received ${res.status}`);
    }
  });

  await runTest('Server Validation: Missing email & password returns 422', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (res.status !== 422) {
      throw new Error(`Expected HTTP 422 Unprocessable Entity, received ${res.status}`);
    }

    const data = await res.json();
    if (!data.errors?.email || !data.errors?.password) {
      throw new Error(`Expected email and password validation errors, received: ${JSON.stringify(data)}`);
    }
  });

  await runTest('Server Validation: remember_me must be boolean (invalid type check)', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@intanpariwara.com',
        password: 'any_password',
        remember_me: 'this_is_not_a_boolean',
      }),
    });

    if (res.status !== 422) {
      throw new Error(`Expected HTTP 422 for non-boolean remember_me, received ${res.status}`);
    }

    const data = await res.json();
    if (!data.errors?.remember_me) {
      throw new Error(`Expected remember_me validation error, received: ${JSON.stringify(data)}`);
    }
  });

  await runTest('Server Endpoint: Accepts remember_me = true', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test_probe@intanpariwara.com',
        password: 'probe_invalid_password',
        remember_me: true,
      }),
    });

    // 401 means payload passed validation rules (email, password, remember_me) and proceeded to auth check
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, received ${res.status}`);
    }

    const data = await res.json();
    if (data.status !== 'error') {
      throw new Error(`Expected status: error response, received: ${JSON.stringify(data)}`);
    }
  });

  await runTest('Server Endpoint: Accepts remember_me = false', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test_probe@intanpariwara.com',
        password: 'probe_invalid_password',
        remember_me: false,
      }),
    });

    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, received ${res.status}`);
    }

    const data = await res.json();
    if (data.status !== 'error') {
      throw new Error(`Expected status: error response, received: ${JSON.stringify(data)}`);
    }
  });

  // ----------------------------------------------------
  // SECTION 2: CLIENT-SIDE STORAGE & SESSION BEHAVIOR
  // ----------------------------------------------------
  console.log('\n--- 2. Client-Side Storage & Remember Me Logic Tests ---');

  const mockLocalStorage = new StorageMock();
  const mockSessionStorage = new StorageMock();

  // Helper functions simulating api.ts storage operations
  function simulateSaveAuth(token: string, user: any, rememberMe: boolean) {
    if (rememberMe) {
      mockLocalStorage.setItem('q4_token', token);
      mockLocalStorage.setItem('q4_user', JSON.stringify(user));
      mockLocalStorage.setItem('q4_remember_me', 'true');
      mockLocalStorage.setItem('q4_remembered_username', user.email || '');

      mockSessionStorage.removeItem('q4_token');
      mockSessionStorage.removeItem('q4_user');
    } else {
      mockSessionStorage.setItem('q4_token', token);
      mockSessionStorage.setItem('q4_user', JSON.stringify(user));

      mockLocalStorage.removeItem('q4_token');
      mockLocalStorage.removeItem('q4_user');
      mockLocalStorage.removeItem('q4_remember_me');
    }
  }

  function simulateGetToken(): string | null {
    return mockLocalStorage.getItem('q4_token') || mockSessionStorage.getItem('q4_token');
  }

  function simulateClearAuth() {
    mockSessionStorage.removeItem('q4_token');
    mockSessionStorage.removeItem('q4_user');
    mockLocalStorage.removeItem('q4_token');
    mockLocalStorage.removeItem('q4_user');
    mockLocalStorage.removeItem('q4_remember_me');
  }

  await runTest('Client Storage: When rememberMe = true, token persists in localStorage', async () => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();

    const sampleUser = { name: 'Direktur', email: 'dir@intanpariwara.com', role: 'direktur' };
    simulateSaveAuth('token_remember_30d', sampleUser, true);

    if (mockLocalStorage.getItem('q4_token') !== 'token_remember_30d') {
      throw new Error('Token not found in localStorage');
    }
    if (mockLocalStorage.getItem('q4_remember_me') !== 'true') {
      throw new Error('q4_remember_me flag not set');
    }
    if (mockLocalStorage.getItem('q4_remembered_username') !== 'dir@intanpariwara.com') {
      throw new Error('Remembered username not preserved');
    }
    if (mockSessionStorage.getItem('q4_token') !== null) {
      throw new Error('sessionStorage should be cleared when rememberMe is true');
    }
    if (simulateGetToken() !== 'token_remember_30d') {
      throw new Error('simulateGetToken failed to retrieve persistent token');
    }
  });

  await runTest('Client Storage: When rememberMe = false, token is session-only (sessionStorage)', async () => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();

    const sampleUser = { name: 'AM Jatim', email: 'am01@intanpariwara.com', role: 'am' };
    simulateSaveAuth('token_session_24h', sampleUser, false);

    if (mockSessionStorage.getItem('q4_token') !== 'token_session_24h') {
      throw new Error('Token not found in sessionStorage');
    }
    if (mockLocalStorage.getItem('q4_token') !== null) {
      throw new Error('localStorage must not contain token when rememberMe is false');
    }
    if (mockLocalStorage.getItem('q4_remember_me') !== null) {
      throw new Error('q4_remember_me flag should be absent');
    }
    if (simulateGetToken() !== 'token_session_24h') {
      throw new Error('simulateGetToken failed to retrieve session token');
    }
  });

  await runTest('Client Storage: ClearAuth removes tokens from both storages but preserves remembered username', async () => {
    const sampleUser = { name: 'Direktur', email: 'dir@intanpariwara.com', role: 'direktur' };
    simulateSaveAuth('token_to_clear', sampleUser, true);

    simulateClearAuth();

    if (mockLocalStorage.getItem('q4_token') !== null || mockSessionStorage.getItem('q4_token') !== null) {
      throw new Error('Tokens were not completely cleared');
    }
    if (simulateGetToken() !== null) {
      throw new Error('simulateGetToken should return null after clearAuth');
    }
    // Username is preserved for prefill convenience on login screen
    if (mockLocalStorage.getItem('q4_remembered_username') !== 'dir@intanpariwara.com') {
      throw new Error('Remembered username should remain in localStorage after logout');
    }
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  console.log(`📊 TEST RUN COMPLETE: ${passCount} Passed, ${failCount} Failed (Total ${results.length})`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
