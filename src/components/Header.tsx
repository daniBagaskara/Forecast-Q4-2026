import React from 'react';
import {
  RotateCw,
  LogOut,
  Clock,
  Shield,
  Building2,
} from 'lucide-react';
import { User, MetaResponse } from '../types';
import { formatSyncDate } from '../utils/formatters';

interface HeaderProps {
  user: User;
  meta: MetaResponse | null;
  onRefresh: () => void;
  onLogout: () => void;
  onOpenSkuModal?: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  meta,
  onRefresh,
  onLogout,
  isLoading,
}) => {

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Brand, Title & Subtitle */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
                IP
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Monitoring Pesanan &amp; Forecast Q4 2026
              </h1>
            </div>

            {/* Subtitle with elegant institutional brand attribution */}
            <div className="flex items-center gap-2 text-xs text-slate-500 pl-11 flex-wrap">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                PT Intan Pariwara
              </span>
              <span className="text-slate-300">·</span>
              <span>Realisasi Pesanan (SO) terhadap Target Forecast PO Q4</span>

              {meta && (
                <>
                  <span className="text-slate-300 hidden md:inline">·</span>
                  <span className="hidden md:flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Sinkronisasi: {formatSyncDate(meta.last_sync_pesanan)}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Role Badge, Excluded SKU, Refresh, and User Profile */}
          <div className="flex items-center gap-3 flex-wrap justify-between lg:justify-end pl-11 lg:pl-0">
            {/* Role / Access badge */}
            {user.role === 'am' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>Wilayah: {user.am_code} - {user.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Akses Nasional</span>
              </div>
            )}

            {/* Refresh Action */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              title="Sinkronisasi &amp; Refresh Data"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase border border-slate-200/80">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {user.role === 'direktur' ? 'Direktur Penjualan' : `Area Manager (${user.am_code || ''})`}
                </p>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Keluar dari Akun"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
