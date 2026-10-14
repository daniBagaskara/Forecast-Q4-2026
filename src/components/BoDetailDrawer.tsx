import React, { useMemo } from 'react';
import {
  X,
  Store,
  Building,
  Target,
  ShoppingCart,
  Percent,
  Download,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { FactRecord, MetricType } from '../types';
import {
  formatRupiahShort,
  formatThousand,
  formatPercentValue,
  getAchievementStyle,
} from '../utils/formatters';
import { exportToExcel } from '../services/export';

interface BoDetailDrawerProps {
  boCode: string | null;
  onClose: () => void;
  facts: FactRecord[];
  metric: MetricType;
}

export const BoDetailDrawer: React.FC<BoDetailDrawerProps> = ({
  boCode,
  onClose,
  facts,
  metric,
}) => {
  if (!boCode) return null;

  const isNetto = metric === 'netto';

  // Filter all fact records for this BO
  const boFacts = useMemo(() => {
    return facts.filter((f) => f.bo_code === boCode);
  }, [facts, boCode]);

  const firstFact = boFacts[0];
  const boName = firstFact ? firstFact.bo_name : boCode;
  const amName = firstFact ? `${firstFact.am_code} - ${firstFact.am_name}` : '';

  // Calculate BO totals
  const totalForecast = useMemo(() => {
    return boFacts.reduce((acc, f) => acc + f.forecast, 0);
  }, [boFacts]);

  const totalPesanan = useMemo(() => {
    return boFacts.reduce(
      (acc, f) => acc + (isNetto ? f.pesanan_netto : f.pesanan_bruto),
      0
    );
  }, [boFacts, isNetto]);

  const { pct, label, isWithoutForecast } = formatPercentValue(totalPesanan, totalForecast);
  const totalGap = totalForecast - totalPesanan;
  const achievementStyle = getAchievementStyle(pct, isWithoutForecast);

  // Group by Principal
  const principalRows = useMemo(() => {
    const map = new Map<string, { forecast: number; pesanan: number }>();
    boFacts.forEach((f) => {
      const pr = f.principal;
      const curr = map.get(pr) || { forecast: 0, pesanan: 0 };
      const val = isNetto ? f.pesanan_netto : f.pesanan_bruto;
      map.set(pr, {
        forecast: curr.forecast + f.forecast,
        pesanan: curr.pesanan + val,
      });
    });

    return Array.from(map.entries())
      .map(([principal, data]) => {
        const pResult = formatPercentValue(data.pesanan, data.forecast);
        return {
          principal,
          forecast: data.forecast,
          pesanan: data.pesanan,
          pct: pResult.pct ?? -1,
          pct_label: pResult.label,
          isWithoutForecast: pResult.isWithoutForecast,
          gap: data.forecast - data.pesanan,
        };
      })
      .sort((a, b) => b.pesanan - a.pesanan);
  }, [boFacts, isNetto]);

  // Group by Month
  const monthlyRows = useMemo(() => {
    const monthNames: Record<number, string> = {
      10: 'Oktober 2026',
      11: 'November 2026',
      12: 'Desember 2026',
    };

    return [10, 11, 12].map((bNo) => {
      const mFacts = boFacts.filter((f) => f.bulan_no === bNo);
      const fc = mFacts.reduce((acc, f) => acc + f.forecast, 0);
      const ps = mFacts.reduce(
        (acc, f) => acc + (isNetto ? f.pesanan_netto : f.pesanan_bruto),
        0
      );
      const pResult = formatPercentValue(ps, fc);
      return {
        bulan_no: bNo,
        name: monthNames[bNo],
        forecast: fc,
        pesanan: ps,
        pct: pResult.pct ?? -1,
        pct_label: pResult.label,
        isWithoutForecast: pResult.isWithoutForecast,
        gap: fc - ps,
      };
    });
  }, [boFacts, isNetto]);

  const handleExportDrawer = () => {
    exportToExcel(
      principalRows,
      [
        { header: 'Principal', key: 'principal' },
        { header: 'Target Forecast PO (Rp)', key: 'forecast', format: (r) => r.forecast },
        { header: `Realisasi Pesanan ${isNetto ? 'Netto' : 'Bruto'} (Rp)`, key: 'pesanan', format: (r) => r.pesanan },
        { header: '% Capaian', key: 'pct', format: (r) => r.pct_label },
        { header: 'Gap / Selisih (Rp)', key: 'gap', format: (r) => r.gap },
      ],
      `Detail_BO_${boCode}_Principal_${metric}`,
      `BO ${boCode}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {boCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">{boName}</h3>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Building className="w-3 h-3 text-slate-400" />
                <span>{amName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDrawer}
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Export rincian BO ke XLSX"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Tutup panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics for this BO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Forecast PO</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">
                {formatRupiahShort(totalForecast)}
              </span>
              <span className="text-[10px] text-slate-400 tabular-nums">
                Rp {formatThousand(totalForecast)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                Pesanan ({isNetto ? 'Netto' : 'Bruto'})
              </span>
              <span className="text-sm font-bold text-indigo-700 block mt-0.5">
                {formatRupiahShort(totalPesanan)}
              </span>
              <span className="text-[10px] text-slate-400 tabular-nums">
                Rp {formatThousand(totalPesanan)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">% Capaian</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">
                {label}
              </span>
              <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${achievementStyle.bg} ${achievementStyle.text} ${achievementStyle.border}`}>
                {achievementStyle.label.split(' ')[0]}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Gap / Selisih</span>
              <span className="text-sm font-bold text-amber-700 block mt-0.5">
                {formatRupiahShort(totalGap)}
              </span>
              <span className="text-[10px] text-slate-400 tabular-nums">
                Rp {formatThousand(totalGap)}
              </span>
            </div>
          </div>

          {/* Performance Table per Principal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                Rincian Performa per Principal
              </h4>
              <span className="text-[11px] text-slate-500">{principalRows.length} Principal</span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Principal</th>
                    <th className="py-2.5 px-3 text-right">Target Forecast</th>
                    <th className="py-2.5 px-3 text-right">Pesanan ({isNetto ? 'Netto' : 'Bruto'})</th>
                    <th className="py-2.5 px-3 text-center">% Capai</th>
                    <th className="py-2.5 px-3 text-right">Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {principalRows.map((r) => {
                    const style = getAchievementStyle(r.pct >= 0 ? r.pct : null, r.isWithoutForecast);
                    return (
                      <tr key={r.principal} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {r.principal}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                          {formatThousand(r.forecast, true)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-indigo-700 tabular-nums">
                          {formatThousand(r.pesanan, true)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                            {r.pct_label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-700 font-medium tabular-nums">
                          {formatThousand(r.gap, true)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Rincian per Bulan Q4 2026
              </h4>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Periode</th>
                    <th className="py-2.5 px-3 text-right">Target Forecast</th>
                    <th className="py-2.5 px-3 text-right">Pesanan</th>
                    <th className="py-2.5 px-3 text-center">% Capai</th>
                    <th className="py-2.5 px-3 text-right">Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyRows.map((m) => {
                    const style = getAchievementStyle(m.pct >= 0 ? m.pct : null, m.isWithoutForecast);
                    return (
                      <tr key={m.bulan_no} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {m.name}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                          {formatThousand(m.forecast, true)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-indigo-700 tabular-nums">
                          {formatThousand(m.pesanan, true)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                            {m.pct_label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-700 font-medium tabular-nums">
                          {formatThousand(m.gap, true)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Data terfilter berdasarkan metrik {isNetto ? 'Netto' : 'Bruto'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
