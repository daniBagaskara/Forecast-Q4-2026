import React from 'react';
import {
  RotateCw,
  LogOut,
  Info,
  Clock,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import { User, MetricType, MetaResponse } from '../types';
import { formatSyncDate } from '../utils/formatters';

interface HeaderProps {
  user: User;
  meta: MetaResponse | null;
  metric: MetricType;
  onMetricChange: (metric: MetricType) => void;
  onRefresh: () => void;
  onLogout: () => void;
  onOpenSkuModal: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  meta,
  metric,
  onMetricChange,
  onRefresh,
  onLogout,
  onOpenSkuModal,
  isLoading,
}) => {
  const excludedCount = meta?.excluded_skus?.length || 0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Quiet Banner Bar for Region Notice, Sync Status, and Excluded SKU */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-white font-semibold tracking-wide">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>PT INTAN PARIWARA</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {user.role === 'am' ? (
            <div className="flex items-center gap-1.5 text-sky-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Wilayah: {user.am_code} - {user.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Akses Nasional (Direktur Penjualan)</span>
            </div>
          )}

          {meta && (
            <div className="hidden lg:flex items-center gap-2 text-slate-400">
              <span className="text-slate-700">·</span>
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Pesanan: {formatSyncDate(meta.last_sync_pesanan)}</span>
              <span className="text-slate-700">·</span>
              <span>Forecast: {formatSyncDate(meta.last_sync_forecast)}</span>
            </div>
          )}
        </div>

        {/* Right side: Dynamic SKU Excluded Badge */}
        {excludedCount > 0 && (
          <div className="flex items-center">
            <button
              onClick={onOpenSkuModal}
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-900/70 px-2 py-0.5 rounded border border-amber-800/60 transition-colors text-[11px] cursor-pointer"
              title={`Klik untuk melihat rincian ${excludedCount} SKU yang dikecualikan dari perhitungan`}
            >
              <Info className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{excludedCount} SKU Dikecualikan</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Clean Header Row */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Clean Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-2xs">
            IP
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Monitoring Pesanan &amp; Forecast Q4 2026
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Pencapaian Realisasi Pesanan (SO) vs Target Forecast PO Q4
            </p>
          </div>
        </div>

        {/* Right: Netto/Bruto Toggle, Refresh, User Profile & Logout */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Segmented Netto | Bruto Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => onMetricChange('netto')}
              className={`px-3 py-1 font-semibold rounded-md transition-all cursor-pointer ${
                metric === 'netto'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Netto
            </button>
            <button
              type="button"
              onClick={() => onMetricChange('bruto')}
              className={`px-3 py-1 font-semibold rounded-md transition-all cursor-pointer ${
                metric === 'bruto'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bruto
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            title="Sinkronisasi &amp; Refresh Data"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase border border-slate-200">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {user.role === 'direktur' ? 'Direktur Penjualan' : `AM (${user.am_code || ''})`}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-0.5"
              title="Keluar dari Aplikasi"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
