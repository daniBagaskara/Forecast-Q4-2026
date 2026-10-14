import React from 'react';
import {
  RotateCw,
  LogOut,
  Info,
  Clock,
  Building2,
  Database,
  SlidersHorizontal,
} from 'lucide-react';
import { User, MetricType, MetaResponse } from '../types';

interface HeaderProps {
  user: User;
  meta: MetaResponse | null;
  metric: MetricType;
  onMetricChange: (metric: MetricType) => void;
  onRefresh: () => void;
  onLogout: () => void;
  onOpenSkuModal: () => void;
  isLoading: boolean;
  isMockActive: boolean;
  onToggleMockMode: () => void;
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
  isMockActive,
  onToggleMockMode,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner Bar for Region Notice & Sync Status */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-200">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-white tracking-wide">PT INTAN PARIWARA</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {user.role === 'am' ? (
            <div className="flex items-center gap-1.5 text-sky-300 font-medium bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>Wilayah: {user.am_code} - {user.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Akses Nasional (Direktur Penjualan)</span>
            </div>
          )}

          {meta && (
            <div className="hidden md:flex items-center gap-2 text-slate-400">
              <span className="text-slate-600">·</span>
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Pesanan per: {meta.last_sync_pesanan}</span>
              <span className="text-slate-600">·</span>
              <span>Forecast per: {meta.last_sync_forecast}</span>
            </div>
          )}
        </div>

        {/* Right side of top bar: SKU Excluded Badge & Mode toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSkuModal}
            className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 bg-amber-950/70 hover:bg-amber-900/80 px-2 py-0.5 rounded border border-amber-800/80 transition-colors text-[11px] cursor-pointer"
            title="Klik untuk melihat detail 4 SKU yang dikecualikan"
          >
            <Info className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">4 SKU Sarana Keterampilan Menulis dikecualikan</span>
            <span className="sm:hidden">4 SKU Excluded</span>
          </button>

          <button
            onClick={onToggleMockMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
              isMockActive
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 hover:bg-amber-500/40'
                : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/40'
            }`}
            title="Klik untuk beralih mode sumber data (API Live Server Asli / Mock Data)"
          >
            <Database className="w-3 h-3" />
            <span>{isMockActive ? 'Mode: Mock (Data Tiruan)' : 'Mode: Live API (Server Asli)'}</span>
          </button>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
            IP
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Monitoring Pesanan &amp; Forecast Q4 2026
            </h1>
            <p className="text-xs text-slate-500">
              Pencapaian Realisasi Pesanan (SO) terhadap Target Forecast PO Q4
            </p>
          </div>
        </div>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Netto | Bruto Toggle Switch */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 px-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-400" />
              Metrik:
            </span>
            <button
              type="button"
              onClick={() => onMetricChange('netto')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                metric === 'netto'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Netto
            </button>
            <button
              type="button"
              onClick={() => onMetricChange('bruto')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                metric === 'bruto'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bruto
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
            title="Sinkronisasi &amp; Refresh Data"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* User Profile Card & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[150px]">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-500 capitalize leading-tight">
                {user.role === 'direktur' ? 'Direktur Penjualan' : `Area Manager (${user.am_code})`}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
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
