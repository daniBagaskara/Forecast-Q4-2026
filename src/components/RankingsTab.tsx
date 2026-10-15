import React, { useMemo } from 'react';
import {
  Trophy,
  AlertTriangle,
  HelpCircle,
  Download,
  ChevronRight,
} from 'lucide-react';
import { FactRecord } from '../types';
import {
  formatThousand,
  formatRupiahShort,
  formatPercentValue,
  getAchievementStyle,
} from '../utils/formatters';
import { exportToExcel } from '../services/export';

interface RankingsTabProps {
  facts: FactRecord[];
  onOpenBoDrawer: (boCode: string) => void;
}

export const RankingsTab: React.FC<RankingsTabProps> = ({
  facts,
  onOpenBoDrawer,
}) => {
  // Aggregate all facts by BO with unified Bruto and Netto
  const aggregatedBos = useMemo(() => {
    const map = new Map<
      string,
      {
        bo_code: string;
        bo_name: string;
        am_code: string;
        forecast: number;
        pesanan_bruto: number;
        pesanan_netto: number;
      }
    >();

    facts.forEach((f) => {
      const current = map.get(f.bo_code) || {
        bo_code: f.bo_code,
        bo_name: f.bo_name,
        am_code: f.am_code,
        forecast: 0,
        pesanan_bruto: 0,
        pesanan_netto: 0,
      };
      map.set(f.bo_code, {
        ...current,
        forecast: current.forecast + (f.forecast || 0),
        pesanan_bruto: current.pesanan_bruto + (f.pesanan_bruto || 0),
        pesanan_netto: current.pesanan_netto + (f.pesanan_netto || 0),
      });
    });

    return Array.from(map.values()).map((b) => {
      const { pct: pctBruto, label: pctBrutoLabel, isWithoutForecast } = formatPercentValue(
        b.pesanan_bruto,
        b.forecast
      );
      const { pct: pctNetto, label: pctNettoLabel } = formatPercentValue(
        b.pesanan_netto,
        b.forecast
      );
      return {
        ...b,
        pct_bruto: pctBruto ?? -1,
        pct_bruto_label: pctBrutoLabel,
        pct_netto: pctNetto ?? -1,
        pct_netto_label: pctNettoLabel,
        isWithoutForecast,
        gap_bruto: b.forecast - b.pesanan_bruto,
        gap_netto: b.forecast - b.pesanan_netto,
      };
    });
  }, [facts]);

  // Top 10 BOs with forecast > 0 (by % Capai Bruto)
  const top10 = useMemo(() => {
    return aggregatedBos
      .filter((b) => b.forecast > 0 && b.pct_bruto >= 0)
      .sort((a, b) => b.pct_bruto - a.pct_bruto)
      .slice(0, 10);
  }, [aggregatedBos]);

  // Bottom 10 BOs with forecast > 0 (by % Capai Bruto)
  const bottom10 = useMemo(() => {
    return aggregatedBos
      .filter((b) => b.forecast > 0 && b.pct_bruto >= 0)
      .sort((a, b) => a.pct_bruto - b.pct_bruto)
      .slice(0, 10);
  }, [aggregatedBos]);

  // Cabang dengan "Pesanan Tanpa Forecast" (Pesanan > 0 tapi Forecast = 0)
  const unforecastedOrders = useMemo(() => {
    const map = new Map<
      string,
      {
        bo_code: string;
        bo_name: string;
        am_code: string;
        principal: string;
        pesanan_bruto: number;
        pesanan_netto: number;
        forecast: number;
        bulan_no: number;
      }
    >();

    facts.forEach((f) => {
      const valBruto = f.pesanan_bruto || 0;
      const valNetto = f.pesanan_netto || 0;
      if (f.forecast === 0 && valBruto > 0) {
        const key = `${f.bo_code}_${f.principal}_${f.bulan_no}`;
        map.set(key, {
          bo_code: f.bo_code,
          bo_name: f.bo_name,
          am_code: f.am_code,
          principal: f.principal,
          pesanan_bruto: valBruto,
          pesanan_netto: valNetto,
          forecast: 0,
          bulan_no: f.bulan_no,
        });
      }
    });

    return Array.from(map.values());
  }, [facts]);

  const handleExportTop10 = () => {
    exportToExcel(
      top10,
      [
        { header: 'Peringkat', key: 'rank', format: (_row, i) => i + 1 },
        { header: 'Kode BO', key: 'bo_code' },
        { header: 'Nama Cabang', key: 'bo_name' },
        { header: 'Wilayah AM', key: 'am_code' },
        { header: 'Target Forecast PO (Rp)', key: 'forecast', format: (r) => r.forecast },
        { header: 'Pesanan Bruto (Rp)', key: 'pesanan_bruto', format: (r) => r.pesanan_bruto },
        { header: 'Pesanan Netto (Rp)', key: 'pesanan_netto', format: (r) => r.pesanan_netto },
        { header: '% Capai Bruto', key: 'pct_bruto', format: (r) => r.pct_bruto_label },
        { header: 'Gap Bruto (Rp)', key: 'gap_bruto', format: (r) => r.gap_bruto },
      ],
      `Top_10_Cabang_Q4_2026`,
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
        { header: 'Pesanan Bruto (Rp)', key: 'pesanan_bruto', format: (r) => r.pesanan_bruto },
        { header: 'Pesanan Netto (Rp)', key: 'pesanan_netto', format: (r) => r.pesanan_netto },
        { header: '% Capai Bruto', key: 'pct_bruto', format: (r) => r.pct_bruto_label },
        { header: 'Defisit Bruto (Rp)', key: 'gap_bruto', format: (r) => r.gap_bruto },
      ],
      `Bottom_10_Cabang_Q4_2026`,
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
        { header: 'Pesanan Bruto (Rp)', key: 'pesanan_bruto', format: (r) => r.pesanan_bruto },
        { header: 'Pesanan Netto (Rp)', key: 'pesanan_netto', format: (r) => r.pesanan_netto },
        { header: 'Keterangan', key: 'status', format: () => 'Pesanan di luar alokasi target forecast awal' },
      ],
      `Cabang_Pesanan_Tanpa_Forecast_Q4_2026`,
      'Tanpa Forecast'
    );
  };

  return (
    <div className="space-y-8">
      {/* Top 10 & Bottom 10 Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 BO Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Top 10 Cabang Berkinerja Terbaik
                  </h3>
                  <p className="text-xs text-slate-400">
                    Berdasarkan % realisasi terhadap target forecast PO
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportTop10}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {top10.map((b, idx) => {
                const style = getAchievementStyle(b.pct_bruto, false);
                return (
                  <div
                    key={b.bo_code}
                    onClick={() => onOpenBoDrawer(b.bo_code)}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-900'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-800'
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
                          <span className="font-semibold text-xs text-slate-800">
                            {b.bo_name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {b.am_code} · Bruto: {formatRupiahShort(b.pesanan_bruto)} (Net: {formatRupiahShort(b.pesanan_netto)})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                        {b.pct_bruto_label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom 10 BO Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bottom 10 Cabang (Perlu Perhatian)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cabang dengan % capaian terendah terhadap target
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportBottom10}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {bottom10.map((b, idx) => {
                const style = getAchievementStyle(b.pct_bruto, false);
                return (
                  <div
                    key={b.bo_code}
                    onClick={() => onOpenBoDrawer(b.bo_code)}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {b.bo_code}
                          </span>
                          <span className="font-semibold text-xs text-slate-800">
                            {b.bo_name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {b.am_code} · Defisit: {formatRupiahShort(b.gap_bruto)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                        {b.pct_bruto_label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Special Table: Cabang dengan "Pesanan Tanpa Forecast" */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cabang dengan Pesanan Tanpa Forecast (Unallocated Sales)
              </h3>
              <p className="text-xs text-slate-400">
                Transaksi pesanan terealisasi pada kombinasi yang tidak memiliki alokasi target forecast awal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              {unforecastedOrders.length} Catatan
            </span>
            <button
              onClick={handleExportUnforecasted}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export XLSX</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Kode BO</th>
                <th className="py-3 px-5">Nama Cabang</th>
                <th className="py-3 px-5">Wilayah AM</th>
                <th className="py-3 px-5">Principal</th>
                <th className="py-3 px-5">Periode</th>
                <th className="py-3 px-5 text-right">Target Forecast</th>
                <th className="py-3 px-5 text-right">Pesanan Bruto &amp; Netto</th>
                <th className="py-3 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {unforecastedOrders.map((row, idx) => (
                <tr
                  key={`${row.bo_code}_${row.principal}_${idx}`}
                  onClick={() => onOpenBoDrawer(row.bo_code)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                      {row.bo_code}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-slate-800">
                    {row.bo_name}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500 font-medium">
                    {row.am_code}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    {row.principal}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500">
                    Bulan {row.bulan_no}
                  </td>
                  <td className="py-3.5 px-5 text-right text-slate-400 font-mono">
                    Rp 0
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="font-bold text-emerald-700 tabular-nums">
                      {formatThousand(row.pesanan_bruto, true)}
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      Netto: {formatThousand(row.pesanan_netto, true)}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                      Tanpa Forecast
                    </span>
                  </td>
                </tr>
              ))}

              {unforecastedOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
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
