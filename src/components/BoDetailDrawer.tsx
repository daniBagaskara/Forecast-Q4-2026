import React, { useMemo } from 'react';
import {
  X,
  Store,
  Building,
  Target,
  Download,
  Calendar,
} from 'lucide-react';
import { FactRecord } from '../types';
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
}

export const BoDetailDrawer: React.FC<BoDetailDrawerProps> = ({
  boCode,
  onClose,
  facts,
}) => {
  if (!boCode) return null;

  // Filter all fact records for this BO
  const boFacts = useMemo(() => {
    return facts.filter((f) => f.bo_code === boCode);
  }, [facts, boCode]);

  const firstFact = boFacts[0];
  const boName = firstFact ? firstFact.bo_name : boCode;
  const amName = firstFact ? `${firstFact.am_code} - ${firstFact.am_name}` : '';

  // Calculate BO totals
  const totalForecast = useMemo(() => {
    return boFacts.reduce((acc, f) => acc + (f.forecast || 0), 0);
  }, [boFacts]);

  const totalPesananBruto = useMemo(() => {
    return boFacts.reduce((acc, f) => acc + (f.pesanan_bruto || 0), 0);
  }, [boFacts]);

  const totalPesananNetto = useMemo(() => {
    return boFacts.reduce((acc, f) => acc + (f.pesanan_netto || 0), 0);
  }, [boFacts]);

  const { pct: pctBruto, label: pctBrutoLabel, isWithoutForecast } = formatPercentValue(
    totalPesananBruto,
    totalForecast
  );
  const { label: pctNettoLabel } = formatPercentValue(totalPesananNetto, totalForecast);

  const totalGapBruto = totalForecast - totalPesananBruto;
  const totalGapNetto = totalForecast - totalPesananNetto;
  const achievementStyle = getAchievementStyle(pctBruto, isWithoutForecast);

  // Group by Principal
  const principalRows = useMemo(() => {
    const map = new Map<
      string,
      { forecast: number; pesanan_bruto: number; pesanan_netto: number }
    >();
    boFacts.forEach((f) => {
      const pr = f.principal;
      const curr = map.get(pr) || { forecast: 0, pesanan_bruto: 0, pesanan_netto: 0 };
      map.set(pr, {
        forecast: curr.forecast + (f.forecast || 0),
        pesanan_bruto: curr.pesanan_bruto + (f.pesanan_bruto || 0),
        pesanan_netto: curr.pesanan_netto + (f.pesanan_netto || 0),
      });
    });

    return Array.from(map.entries())
      .map(([principal, data]) => {
        const pBruto = formatPercentValue(data.pesanan_bruto, data.forecast);
        const pNetto = formatPercentValue(data.pesanan_netto, data.forecast);
        return {
          principal,
          forecast: data.forecast,
          pesanan_bruto: data.pesanan_bruto,
          pesanan_netto: data.pesanan_netto,
          pct_bruto: pBruto.pct ?? -1,
          pct_bruto_label: pBruto.label,
          pct_netto_label: pNetto.label,
          isWithoutForecast: pBruto.isWithoutForecast,
          gap_bruto: data.forecast - data.pesanan_bruto,
          gap_netto: data.forecast - data.pesanan_netto,
        };
      })
      .sort((a, b) => b.pesanan_bruto - a.pesanan_bruto);
  }, [boFacts]);

  // Group by Month
  const monthlyRows = useMemo(() => {
    const monthNames: Record<number, string> = {
      10: 'Oktober 2026',
      11: 'November 2026',
      12: 'Desember 2026',
    };

    return [10, 11, 12].map((bNo) => {
      const mFacts = boFacts.filter((f) => f.bulan_no === bNo);
      const fc = mFacts.reduce((acc, f) => acc + (f.forecast || 0), 0);
      const psBruto = mFacts.reduce((acc, f) => acc + (f.pesanan_bruto || 0), 0);
      const psNetto = mFacts.reduce((acc, f) => acc + (f.pesanan_netto || 0), 0);
      const pBruto = formatPercentValue(psBruto, fc);
      const pNetto = formatPercentValue(psNetto, fc);

      return {
        bulan_no: bNo,
        name: monthNames[bNo],
        forecast: fc,
        pesanan_bruto: psBruto,
        pesanan_netto: psNetto,
        pct_bruto: pBruto.pct ?? -1,
        pct_bruto_label: pBruto.label,
        pct_netto_label: pNetto.label,
        isWithoutForecast: pBruto.isWithoutForecast,
        gap_bruto: fc - psBruto,
        gap_netto: fc - psNetto,
      };
    });
  }, [boFacts]);

  const handleExportDrawer = () => {
    exportToExcel(
      principalRows,
      [
        { header: 'Principal', key: 'principal' },
        { header: 'Target Forecast PO (Rp)', key: 'forecast', format: (r) => r.forecast },
        { header: 'Pesanan Bruto (Rp)', key: 'pesanan_bruto', format: (r) => r.pesanan_bruto },
        { header: 'Pesanan Netto (Rp)', key: 'pesanan_netto', format: (r) => r.pesanan_netto },
        { header: '% Capai Bruto', key: 'pct_bruto', format: (r) => r.pct_bruto_label },
        { header: '% Capai Netto', key: 'pct_netto', format: (r) => r.pct_netto_label },
        { header: 'Gap Bruto (Rp)', key: 'gap_bruto', format: (r) => r.gap_bruto },
      ],
      `Detail_BO_${boCode}_Principal`,
      `BO ${boCode}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-100 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {boCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">{boName}</h3>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5" />
                <span>{amName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDrawer}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              title="Export rincian BO ke XLSX"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              aria-label="Tutup panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics for this BO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Forecast PO</span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {formatRupiahShort(totalForecast)}
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums">
                Rp {formatThousand(totalForecast)}
              </span>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Pesanan (Bruto &amp; Netto)
              </span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {formatRupiahShort(totalPesananBruto)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium tabular-nums">
                Netto: {formatRupiahShort(totalPesananNetto)}
              </span>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">% Capaian</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-bold text-slate-900">
                  {pctBrutoLabel}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${achievementStyle.bg} ${achievementStyle.text} ${achievementStyle.border}`}>
                  {achievementStyle.label.split(' ')[0]}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                Netto: {pctNettoLabel}
              </span>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Defisit / Gap</span>
              <span className="text-base font-bold text-amber-700 block mt-1">
                {formatRupiahShort(totalGapBruto)}
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums">
                Netto: {formatRupiahShort(totalGapNetto)}
              </span>
            </div>
          </div>

          {/* Performance Table per Principal */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-slate-700" />
                Rincian Performa per Principal
              </h4>
              <span className="text-[11px] text-slate-400">{principalRows.length} Principal</span>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">Principal</th>
                    <th className="py-3 px-3.5 text-right">Target Forecast</th>
                    <th className="py-3 px-3.5 text-right">Pesanan Bruto &amp; Netto</th>
                    <th className="py-3 px-3.5 text-center">% Capai</th>
                    <th className="py-3 px-3.5 text-right">Defisit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {principalRows.map((r) => {
                    const style = getAchievementStyle(r.pct_bruto >= 0 ? r.pct_bruto : null, r.isWithoutForecast);
                    return (
                      <tr key={r.principal} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-slate-900">
                          {r.principal}
                        </td>
                        <td className="py-3 px-3.5 text-right text-slate-600 tabular-nums">
                          {formatThousand(r.forecast, true)}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="font-bold text-slate-900 tabular-nums">
                            {formatThousand(r.pesanan_bruto, true)}
                          </div>
                          <div className="text-[10px] text-slate-400 tabular-nums">
                            Net: {formatThousand(r.pesanan_netto, true)}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                            {r.pct_bruto_label}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right text-amber-700 font-medium tabular-nums">
                          {formatThousand(r.gap_bruto, true)}
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
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-700" />
                Rincian per Bulan Q4 2026
              </h4>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">Periode</th>
                    <th className="py-3 px-3.5 text-right">Target Forecast</th>
                    <th className="py-3 px-3.5 text-right">Pesanan Bruto &amp; Netto</th>
                    <th className="py-3 px-3.5 text-center">% Capai</th>
                    <th className="py-3 px-3.5 text-right">Defisit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {monthlyRows.map((m) => {
                    const style = getAchievementStyle(m.pct_bruto >= 0 ? m.pct_bruto : null, m.isWithoutForecast);
                    return (
                      <tr key={m.bulan_no} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3.5 font-semibold text-slate-900">
                          {m.name}
                        </td>
                        <td className="py-3 px-3.5 text-right text-slate-600 tabular-nums">
                          {formatThousand(m.forecast, true)}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="font-bold text-slate-900 tabular-nums">
                            {formatThousand(m.pesanan_bruto, true)}
                          </div>
                          <div className="text-[10px] text-slate-400 tabular-nums">
                            Net: {formatThousand(m.pesanan_netto, true)}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                            {m.pct_bruto_label}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right text-amber-700 font-medium tabular-nums">
                          {formatThousand(m.gap_bruto, true)}
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Data tersinkronisasi otomatis
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
