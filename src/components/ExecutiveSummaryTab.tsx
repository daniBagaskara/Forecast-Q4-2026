import React from 'react';
import {
  TrendingUp,
  Target,
  ShoppingCart,
  Percent,
  Compass,
  AlertTriangle,
  Info,
  CalendarCheck2,
} from 'lucide-react';
import { SummaryResponse, MetricType, FactRecord } from '../types';
import {
  formatRupiahShort,
  formatThousand,
  getAchievementStyle,
  calculateRunRate,
} from '../utils/formatters';

interface ExecutiveSummaryTabProps {
  summary: SummaryResponse;
  facts: FactRecord[];
  metric: MetricType;
  skuCount?: number;
  onOpenSkuModal: () => void;
  onSelectPrincipalFilter?: (pr: string) => void;
}

export const ExecutiveSummaryTab: React.FC<ExecutiveSummaryTabProps> = ({
  summary,
  facts,
  metric,
  skuCount = 0,
  onOpenSkuModal,
  onSelectPrincipalFilter,
}) => {
  const isNetto = metric === 'netto';
  const pesananTotal = isNetto ? summary.pesanan_netto : summary.pesanan_bruto;
  const pctTotal = isNetto ? summary.pct_netto : summary.pct_bruto;
  const gapTotal = isNetto ? summary.gap_netto : summary.gap_bruto;

  const achievementStyle = getAchievementStyle(pctTotal, summary.forecast === 0 && pesananTotal > 0);

  // Oktober Run-rate calculation (day 14 of 31 days)
  const oktSummary = summary.per_bulan.find((b) => b.bulan_no === 10);
  const oktForecast = oktSummary?.forecast || 0;
  const oktPesanan = isNetto ? (oktSummary?.pesanan_netto || 0) : (oktSummary?.pesanan_bruto || 0);
  const runRate = calculateRunRate(oktPesanan, oktForecast, 14, 31);

  // Group facts by principal to calculate principal breakdown
  const principalBreakdown = React.useMemo(() => {
    const map = new Map<string, { forecast: number; pesanan: number }>();
    facts.forEach((f) => {
      const pr = f.principal;
      const current = map.get(pr) || { forecast: 0, pesanan: 0 };
      const pesananVal = isNetto ? f.pesanan_netto : f.pesanan_bruto;
      map.set(pr, {
        forecast: current.forecast + f.forecast,
        pesanan: current.pesanan + pesananVal,
      });
    });

    return Array.from(map.entries())
      .map(([name, data]) => {
        const pct = data.forecast > 0 ? (data.pesanan / data.forecast) * 100 : 0;
        return {
          name,
          forecast: data.forecast,
          pesanan: data.pesanan,
          pct,
        };
      })
      .sort((a, b) => b.pesanan - a.pesanan);
  }, [facts, isNetto]);

  return (
    <div className="space-y-4">
      {/* 6 Executive KPI Cards - Clean, high contrast, zero fluff */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Card 1: Target Forecast */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Forecast PO</span>
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {formatRupiahShort(summary.forecast)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums truncate" title={`Rp ${formatThousand(summary.forecast)}`}>
            Rp {formatThousand(summary.forecast)}
          </p>
        </div>

        {/* Card 2: Realisasi Pesanan */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Realisasi {isNetto ? 'Netto' : 'Bruto'}
            </span>
            <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-indigo-600 tracking-tight">
            {formatRupiahShort(pesananTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums truncate" title={`Rp ${formatThousand(pesananTotal)}`}>
            Rp {formatThousand(pesananTotal)}
          </p>
        </div>

        {/* Card 3: % Pencapaian */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Pencapaian</span>
            <Percent className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {pctTotal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border ${achievementStyle.bg} ${achievementStyle.text} ${achievementStyle.border}`}
            >
              {achievementStyle.label.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Card 4: Gap / Selisih */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Defisit / Gap</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-amber-700 tracking-tight">
            {formatRupiahShort(gapTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums truncate" title={`Rp ${formatThousand(gapTotal)}`}>
            Rp {formatThousand(gapTotal)}
          </p>
        </div>

        {/* Card 5: Proyeksi Akhir Bulan */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Proyeksi Okt</span>
            <Compass className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-lg font-bold text-sky-700 tracking-tight">
            {formatRupiahShort(runRate.projectedMonthEnd)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Rata-rata: {formatRupiahShort(runRate.avgPerDay)}/hari
          </p>
        </div>

        {/* Card 6: Kebutuhan Omzet/Hari */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Target Butuh/Hari</span>
            <CalendarCheck2 className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-purple-700 tracking-tight">
            {formatRupiahShort(runRate.requiredPerDay)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Sisa 17 hari (s/d 31 Okt)
          </p>
        </div>
      </div>

      {/* Compact, clean SKU Transparency Strip */}
      {skuCount > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-800">
                Pengecualian {skuCount} SKU Khusus
              </span>
              <span className="text-slate-400 mx-1.5 hidden md:inline">·</span>
              <span className="text-slate-500 hidden md:inline">
                Dicatat terpisah dari perhitungan target reguler
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-slate-600">
              <span className="text-slate-400 text-[11px] mr-1">Netto:</span>
              <strong className="text-slate-800">{formatRupiahShort(summary.excluded_netto)}</strong>
            </div>
            <div className="text-slate-600">
              <span className="text-slate-400 text-[11px] mr-1">Bruto:</span>
              <strong className="text-slate-800">{formatRupiahShort(summary.excluded_bruto)}</strong>
            </div>
            <button
              onClick={onOpenSkuModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer ml-1"
            >
              Lihat Detail &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Visual Analytics Row: Clean, uncluttered layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Monthly Breakdown */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              Komparasi Bulanan Q4 2026
            </h3>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-300" />
                <span className="text-slate-500">Forecast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" />
                <span className="text-slate-700 font-medium">Realisasi</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {summary.per_bulan.map((m) => {
              const pesananVal = isNetto ? m.pesanan_netto : m.pesanan_bruto;
              const pctVal = isNetto ? m.pct_netto : m.pct_bruto;
              const gapVal = isNetto ? m.gap_netto : m.gap_bruto;
              const maxVal = Math.max(m.forecast, pesananVal, 1);
              const forecastWidth = (m.forecast / maxVal) * 100;
              const pesananWidth = (pesananVal / maxVal) * 100;
              const style = getAchievementStyle(pctVal, false);

              return (
                <div key={m.bulan_no} className="p-3 bg-slate-50/60 rounded-lg border border-slate-200/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">{m.bulan_name}</span>
                      {m.bulan_no === 10 && (
                        <span className="text-[10px] bg-sky-100 text-sky-800 font-medium px-1.5 py-0.2 rounded">
                          H-14 Berjalan
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 tabular-nums">
                        {pctVal.toFixed(2)}%
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${style.bg} ${style.text}`}>
                        {style.label.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {/* Forecast */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200/80 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-slate-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${forecastWidth}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 w-20 text-right tabular-nums">
                        {formatRupiahShort(m.forecast)}
                      </span>
                    </div>

                    {/* Realisasi */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200/80 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${style.progressBarColor}`}
                          style={{ width: `${Math.min(pesananWidth, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700 w-20 text-right tabular-nums">
                        {formatRupiahShort(pesananVal)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Defisit: <strong className="text-amber-700">{formatRupiahShort(gapVal)}</strong></span>
                    <span className="tabular-nums">Rp {formatThousand(pesananVal)} / Rp {formatThousand(m.forecast)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Principal Achievement Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              Pencapaian per Principal
            </h3>
          </div>

          <div className="space-y-2">
            {principalBreakdown.map((item) => {
              const style = getAchievementStyle(item.pct, item.forecast === 0 && item.pesanan > 0);
              const barWidth = Math.min(Math.max(item.pct, 0), 100);

              return (
                <div
                  key={item.name}
                  onClick={() => onSelectPrincipalFilter?.(item.name)}
                  className="p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                  title={`Filter ${item.name}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 w-14">{item.name}</span>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {formatRupiahShort(item.pesanan)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 tabular-nums">
                        {item.pct.toFixed(1)}%
                      </span>
                      <span className={`w-2 h-2 rounded-full ${style.progressBarColor}`} />
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${style.progressBarColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
