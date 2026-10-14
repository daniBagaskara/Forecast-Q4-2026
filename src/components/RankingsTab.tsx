import React, { useMemo } from 'react';
import {
  Trophy,
  AlertTriangle,
  HelpCircle,
  Download,
  Store,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { FactRecord, MetricType } from '../types';
import {
  formatThousand,
  formatPercentValue,
  getAchievementStyle,
} from '../utils/formatters';
import { exportToExcel } from '../services/export';

interface RankingsTabProps {
  facts: FactRecord[];
  metric: MetricType;
  onOpenBoDrawer: (boCode: string) => void;
}

export const RankingsTab: React.FC<RankingsTabProps> = ({
  facts,
  metric,
  onOpenBoDrawer,
}) => {
  const isNetto = metric === 'netto';

  // Aggregate all facts by BO
  const aggregatedBos = useMemo(() => {
    const map = new Map<
      string,
      {
        bo_code: string;
        bo_name: string;
        am_code: string;
        forecast: number;
        pesanan: number;
      }
    >();

    facts.forEach((f) => {
      const current = map.get(f.bo_code) || {
        bo_code: f.bo_code,
        bo_name: f.bo_name,
        am_code: f.am_code,
        forecast: 0,
        pesanan: 0,
      };
      const val = isNetto ? f.pesanan_netto : f.pesanan_bruto;
      map.set(f.bo_code, {
        ...current,
        forecast: current.forecast + f.forecast,
        pesanan: current.pesanan + val,
      });
    });

    return Array.from(map.values()).map((b) => {
      const { pct, label, isWithoutForecast } = formatPercentValue(b.pesanan, b.forecast);
      return {
        ...b,
        pct: pct ?? -1,
        pct_label: label,
        isWithoutForecast,
        gap: b.forecast - b.pesanan,
      };
    });
  }, [facts, isNetto]);

  // Top 10 BOs with forecast > 0
  const top10 = useMemo(() => {
    return aggregatedBos
      .filter((b) => b.forecast > 0 && b.pct >= 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);
  }, [aggregatedBos]);

  // Bottom 10 BOs with forecast > 0
  const bottom10 = useMemo(() => {
    return aggregatedBos
      .filter((b) => b.forecast > 0 && b.pct >= 0)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 10);
  }, [aggregatedBos]);

  // Cabang dengan "Pesanan Tanpa Forecast" (Pesanan > 0 tapi Forecast = 0)
  // Check individual fact slices or branch total where forecast is zero but orders exist
  const unforecastedOrders = useMemo(() => {
    const map = new Map<
      string,
      {
        bo_code: string;
        bo_name: string;
        am_code: string;
        principal: string;
        pesanan: number;
        forecast: number;
        bulan_no: number;
      }
    >();

    facts.forEach((f) => {
      const val = isNetto ? f.pesanan_netto : f.pesanan_bruto;
      if (f.forecast === 0 && val > 0) {
        const key = `${f.bo_code}_${f.principal}_${f.bulan_no}`;
        map.set(key, {
          bo_code: f.bo_code,
          bo_name: f.bo_name,
          am_code: f.am_code,
          principal: f.principal,
          pesanan: val,
          forecast: 0,
          bulan_no: f.bulan_no,
        });
      }
    });

    return Array.from(map.values());
  }, [facts, isNetto]);

  const handleExportTop10 = () => {
    exportToExcel(
      top10,
      [
        { header: 'Peringkat', key: 'rank', format: (_row, i) => i + 1 },
        { header: 'Kode BO', key: 'bo_code' },
        { header: 'Nama Cabang', key: 'bo_name' },
        { header: 'Wilayah AM', key: 'am_code' },
        { header: 'Target Forecast PO (Rp)', key: 'forecast', format: (r) => r.forecast },
        { header: `Realisasi Pesanan ${isNetto ? 'Netto' : 'Bruto'} (Rp)`, key: 'pesanan', format: (r) => r.pesanan },
        { header: '% Capaian', key: 'pct', format: (r) => r.pct_label },
        { header: 'Gap (Rp)', key: 'gap', format: (r) => r.gap },
      ],
      `Top_10_Cabang_Q4_2026_${metric}`,
      'Top 10 BO'
    );
  };

  const handleExportBottom10 = () => {
    exportToExcel(
      bottom10,
      [
        { header: 'Peringkat Bawah', key: 'rank', format: (_row, i) => i + 1 },
        { header: 'Kode BO', key: 'bo_code' },
        { header: 'Nama Cabang', key: 'bo_name' },
        { header: 'Wilayah AM', key: 'am_code' },
        { header: 'Target Forecast PO (Rp)', key: 'forecast', format: (r) => r.forecast },
        { header: `Realisasi Pesanan ${isNetto ? 'Netto' : 'Bruto'} (Rp)`, key: 'pesanan', format: (r) => r.pesanan },
        { header: '% Capaian', key: 'pct', format: (r) => r.pct_label },
        { header: 'Defisit / Gap (Rp)', key: 'gap', format: (r) => r.gap },
      ],
      `Bottom_10_Cabang_Q4_2026_${metric}`,
      'Bottom 10 BO'
    );
  };

  const handleExportUnforecasted = () => {
    exportToExcel(
      unforecastedOrders,
      [
        { header: 'Kode BO', key: 'bo_code' },
        { header: 'Nama Cabang', key: 'bo_name' },
        { header: 'Wilayah AM', key: 'am_code' },
        { header: 'Principal', key: 'principal' },
        { header: 'Bulan (Periode)', key: 'bulan_no', format: (r) => `Bulan ${r.bulan_no}` },
        { header: `Realisasi Pesanan ${isNetto ? 'Netto' : 'Bruto'} (Rp)`, key: 'pesanan', format: (r) => r.pesanan },
        { header: 'Keterangan', key: 'status', format: () => 'Pesanan di luar alokasi target forecast awal' },
      ],
      `Cabang_Pesanan_Tanpa_Forecast_Q4_2026_${metric}`,
      'Tanpa Forecast'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top 10 & Bottom 10 Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 BO Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Top 10 Cabang Berkinerja Terbaik
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    Berdasarkan % realisasi terhadap target forecast PO
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportTop10}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                title="Export Top 10 ke XLSX"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px]">Export</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {top10.map((b, idx) => {
                const style = getAchievementStyle(b.pct, false);
                return (
                  <div
                    key={b.bo_code}
                    onClick={() => onOpenBoDrawer(b.bo_code)}
                    className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 shadow-2xs'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700/30 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {b.bo_code}
                          </span>
                          <span className="font-medium text-xs text-slate-800">
                            {b.bo_name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {b.am_code} · Rp {formatThousand(b.pesanan)} / Rp {formatThousand(b.forecast)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`inline-block text-xs font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}>
                          {b.pct_label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom 10 BO Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 bg-red-50/70 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-950">
                    Bottom 10 Cabang (Perlu Perhatian)
                  </h3>
                  <p className="text-[11px] text-red-700">
                    Cabang dengan % capaian terendah terhadap target
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportBottom10}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-800 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                title="Export Bottom 10 ke XLSX"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px]">Export</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {bottom10.map((b, idx) => {
                const style = getAchievementStyle(b.pct, false);
                return (
                  <div
                    key={b.bo_code}
                    onClick={() => onOpenBoDrawer(b.bo_code)}
                    className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {b.bo_code}
                          </span>
                          <span className="font-medium text-xs text-slate-800">
                            {b.bo_name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {b.am_code} · Defisit: Rp {formatThousand(b.gap)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`inline-block text-xs font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}>
                          {b.pct_label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Special Table: Cabang dengan "Pesanan Tanpa Forecast" */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cabang dengan Pesanan Tanpa Forecast (Unallocated Sales)
              </h3>
              <p className="text-xs text-slate-500">
                Daftar transaksi pesanan yang terealisasi pada kombinasi BO/Principal yang tidak memiliki alokasi target forecast awal (Forecast = 0 &amp; Pesanan &gt; 0)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {unforecastedOrders.length} Catatan Ditemukan
            </span>
            <button
              onClick={handleExportUnforecasted}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export XLSX</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Kode BO</th>
                <th className="py-2.5 px-4">Nama Cabang</th>
                <th className="py-2.5 px-4">Wilayah AM</th>
                <th className="py-2.5 px-4">Principal</th>
                <th className="py-2.5 px-4">Periode</th>
                <th className="py-2.5 px-4 text-right">Target Forecast</th>
                <th className="py-2.5 px-4 text-right">Pesanan ({isNetto ? 'Netto' : 'Bruto'})</th>
                <th className="py-2.5 px-4 text-center">Status / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unforecastedOrders.map((row, idx) => (
                <tr
                  key={`${row.bo_code}_${row.principal}_${idx}`}
                  onClick={() => onOpenBoDrawer(row.bo_code)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                      {row.bo_code}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {row.bo_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {row.am_code}
                  </td>
                  <td className="py-3 px-4 font-bold text-indigo-700">
                    {row.principal}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Bulan {row.bulan_no} (Okt)
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono">
                    Rp 0
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">
                    {formatThousand(row.pesanan, true)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                      N/A (Tanpa Forecast)
                    </span>
                  </td>
                </tr>
              ))}

              {unforecastedOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                    Tidak ada pesanan tanpa forecast pada filter yang sedang aktif.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
