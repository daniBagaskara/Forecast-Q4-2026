import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Server,
  Wifi,
  WifiOff,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { api, getApiBaseUrl, checkServerHealth } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'token' | 'demo'>('live');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [tokenRole, setTokenRole] = useState<'direktur' | 'am'>('direktur');
  const [tokenAmCode, setTokenAmCode] = useState('AM 01');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverHealth, setServerHealth] = useState<{
    online: boolean;
    message: string;
    baseUrl: string;
  } | null>(null);

  // Ping real server on mount to verify connectivity
  useEffect(() => {
    checkServerHealth().then((status) => {
      setServerHealth(status);
    });
  }, []);

  // Handle Real API Login
  const handleLiveLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Harap masukkan email dan kata sandi akun resmi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await api.login(email, password);
      onLoginSuccess(result.user);
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMessage(errObj.message || 'Gagal login ke server resmi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Direct Bearer Token Login
  const handleTokenLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMessage('Harap masukkan token Bearer.');
      return;
    }

    try {
      const cleanToken = tokenInput.replace(/^Bearer\s+/i, '').trim();
      const result = api.loginWithToken(
        cleanToken,
        tokenRole,
        tokenRole === 'am' ? tokenAmCode : undefined
      );
      onLoginSuccess(result.user);
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMessage(errObj.message || 'Gagal menggunakan token.');
    }
  };

  // Handle Explicit Demo / Mock Login
  const handleDemoLogin = (role: 'direktur' | 'am') => {
    const result = api.loginMock(role, 'AM 01');
    onLoginSuccess(result.user);
  };

  const targetUrl = getApiBaseUrl();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background geometric accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Company Logo Badge */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-600/30 mb-3 border border-indigo-500/30">
            IP
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            PT Intan Pariwara
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Portal Monitoring Pesanan &amp; Forecast Q4 2026
          </p>

          {/* Server Connection Status Badge */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
            {serverHealth?.online ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Target API: <strong className="text-white">{targetUrl}</strong></span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Memeriksa koneksi API: <strong className="text-slate-200">{targetUrl}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Login Form Card */}
        <div className="mt-6 bg-white rounded-2xl shadow-2xl p-6 sm:p-7 border border-slate-100">
          {/* Tab Selector: Live API vs Direct Token vs Demo */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('live');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Akun Resmi (Live)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('token');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'token'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Input Token
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('demo');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'demo'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode Mock (Demo)
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <span className="font-semibold block">Respons Server:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* TAB 1: REAL LIVE API LOGIN */}
          {activeTab === 'live' && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Masuk dengan Akun Resmi</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Request dikirim langsung ke <code className="text-indigo-600 font-mono text-[11px]">{targetUrl}/auth/login</code>
                </p>
              </div>

              <form onSubmit={handleLiveLogin} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Email Akun
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@intanpariwara.com"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <span>Mengirim permintaan ke server...</span>
                  ) : (
                    <>
                      <span>Masuk ke Live Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: DIRECT BEARER TOKEN INPUT */}
          {activeTab === 'token' && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  Gunakan Bearer Token Langsung
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jika Anda sudah memiliki token dari Postman / aplikasi mobile backend
                </p>
              </div>

              <form onSubmit={handleTokenLogin} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Bearer Token
                  </label>
                  <textarea
                    rows={3}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    required
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Peran (Role)
                    </label>
                    <select
                      value={tokenRole}
                      onChange={(e) => setTokenRole(e.target.value as 'direktur' | 'am')}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                    >
                      <option value="direktur">Direktur Penjualan (Nasional)</option>
                      <option value="am">Area Manager (Wilayah)</option>
                    </select>
                  </div>

                  {tokenRole === 'am' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                        Kode AM
                      </label>
                      <input
                        type="text"
                        value={tokenAmCode}
                        onChange={(e) => setTokenAmCode(e.target.value)}
                        placeholder="AM 01"
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer mt-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gunakan Token &amp; Buka Data Live</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: MOCK DATA (DEMO OFFLINE) */}
          {activeTab === 'demo' && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  Mode Demo / Simulasi (Data Mock)
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Gunakan ini jika server API sedang tidak dapat diakses atau untuk pratinjau tampilan:
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('direktur')}
                  className="w-full p-3 text-left bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-950 group-hover:text-amber-900">
                      Simulasi Direktur Penjualan
                    </span>
                    <span className="text-[10px] font-semibold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                      Mock Data
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Data contoh nasional lengkap (1.500+ record, semua tab aktif)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('am')}
                  className="w-full p-3 text-left bg-sky-50 hover:bg-sky-100/80 border border-sky-200 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-sky-950 group-hover:text-sky-900">
                      Simulasi Area Manager (AM 01)
                    </span>
                    <span className="text-[10px] font-semibold bg-sky-200 text-sky-900 px-1.5 py-0.2 rounded">
                      Mock Data
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-800 mt-0.5">
                    Data contoh terbatas wilayah Sumbagut (Agus Setiadi)
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Sistem Otentikasi Resmi PT Intan Pariwara</span>
          </p>
        </div>
      </div>
    </div>
  );
};
