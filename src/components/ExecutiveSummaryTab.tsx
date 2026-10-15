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
import { SummaryResponse, FactRecord } from '../types';
import {
  formatRupiahShort,
  formatThousand,
  getAchievementStyle,
  calculateRunRate,
} from '../utils/formatters';

interface ExecutiveSummaryTabProps {
  summary: SummaryResponse;
  facts: FactRecord[];
  skuCount?: number;
  onOpenSkuModal: () => void;
  onSelectPrincipalFilter?: (pr: string) => void;
}

export const ExecutiveSummaryTab: React.FC<ExecutiveSummaryTabProps> = ({
  summary,
  facts,
  skuCount = 0,
  onOpenSkuModal,
  onSelectPrincipalFilter,
}) => {
  // Achievement style based on Bruto (as forecast refers to Bruto)
  const achievementStyleBruto = getAchievementStyle(
    summary.pct_bruto,
    summary.forecast === 0 && summary.pesanan_bruto > 0
  );

  // Oktober Run-rate calculation (day 14 of 31 days)
  const oktSummary = summary.per_bulan.find((b) => b.bulan_no === 10);
  const oktForecast = oktSummary?.forecast || 0;
  const oktPesananBruto = oktSummary?.pesanan_bruto || 0;
  const oktPesananNetto = oktSummary?.pesanan_netto || 0;

  const runRateBruto = calculateRunRate(oktPesananBruto, oktForecast, 14, 31);
  const runRateNetto = calculateRunRate(oktPesananNetto, oktForecast, 14, 31);

  // Group facts by principal to calculate principal breakdown (both Bruto & Netto)
  const principalBreakdown = React.useMemo(() => {
    const map = new Map<
      string,
      { forecast: number; pesanan_bruto: number; pesanan_netto: number }
    >();
    facts.forEach((f) => {
      const pr = f.principal;
      const current = map.get(pr) || {
        forecast: 0,
        pesanan_bruto: 0,
        pesanan_netto: 0,
      };
      map.set(pr, {
        forecast: current.forecast + (f.forecast || 0),
        pesanan_bruto: current.pesanan_bruto + (f.pesanan_bruto || 0),
        pesanan_netto: current.pesanan_netto + (f.pesanan_netto || 0),
      });
    });

    return Array.from(map.entries())
      .map(([name, data]) => {
        const pctBruto = data.forecast > 0 ? (data.pesanan_bruto / data.forecast) * 100 : 0;
        const pctNetto = data.forecast > 0 ? (data.pesanan_netto / data.forecast) * 100 : 0;
        return {
          name,
          forecast: data.forecast,
          pesanan_bruto: data.pesanan_bruto,
          pesanan_netto: data.pesanan_netto,
          pct_bruto: pctBruto,
          pct_netto: pctNetto,
        };
      })
      .sort((a, b) => b.pesanan_bruto - a.pesanan_bruto);
  }, [facts]);

  return (
    <div className="space-y-8">
      {/* 2-Row Balanced KPI Grid (3 Columns x 2 Rows) with Generous Breathing Room */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Target Forecast PO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Target Forecast PO
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiahShort(summary.forecast)}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-500">
              Total Target Komersial Q4
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
            <span className="tabular-nums font-medium text-slate-500" title={`Rp ${formatThousand(summary.forecast)}`}>
              Rp {formatThousand(summary.forecast)}
            </span>
            <span className="text-[11px] font-medium text-slate-400">Alokasi Q4</span>
          </div>
        </div>

        {/* Card 2: Realisasi Pesanan (Bruto prominent + Netto subtext) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Realisasi Pesanan (SO)
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            {/* Bruto Prominent */}
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiahShort(summary.pesanan_bruto)}
            </div>
            {/* Netto Subtext */}
            <div className="mt-1 text-sm font-medium text-slate-500">
              Netto: <span className="text-slate-700 font-semibold">{formatRupiahShort(summary.pesanan_netto)}</span>
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
            <span className="tabular-nums font-medium text-slate-500 truncate" title={`Bruto: Rp ${formatThousand(summary.pesanan_bruto)}`}>
              Rp {formatThousand(summary.pesanan_bruto)}
            </span>
            <span className="text-[11px] text-indigo-600 font-medium">Sales Order</span>
          </div>
        </div>

        {/* Card 3: % Pencapaian (Bruto prominent + Netto subtext + badge) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                % Pencapaian
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2.5">
              {/* Bruto % Prominent */}
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {summary.pct_bruto.toLocaleString('id-ID', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}%
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${achievementStyleBruto.bg} ${achievementStyleBruto.text} ${achievementStyleBruto.border}`}
              >
                {achievementStyleBruto.label.split(' ')[0]}
              </span>
            </div>
            {/* Netto % Subtext */}
            <div className="mt-1 text-sm font-medium text-slate-500">
              Netto: <span className="text-slate-700 font-semibold">{summary.pct_netto.toFixed(2)}%</span>
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
            <span className="text-slate-500">vs Target Forecast</span>
            <span className="text-[11px] font-medium text-slate-400">Realisasi / Target</span>
          </div>
        </div>

        {/* Card 4: Defisit / Gap (Gap Bruto prominent + Gap Netto subtext) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Defisit / Gap Target
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            {/* Gap Bruto Prominent */}
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiahShort(summary.gap_bruto)}
            </div>
            {/* Gap Netto Subtext */}
            <div className="mt-1 text-sm font-medium text-slate-500">
              Gap Netto: <span className="text-slate-700 font-semibold">{formatRupiahShort(summary.gap_netto)}</span>
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
            <span className="tabular-nums font-medium text-slate-500 truncate" title={`Rp ${formatThousand(summary.gap_bruto)}`}>
              Rp {formatThousand(summary.gap_bruto)}
            </span>
            <span className="text-[11px] text-amber-700 font-medium">Sisa Target</span>
          </div>
        </div>

        {/* Card 5: Proyeksi Akhir Bulan Okt (Run-rate) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Proyeksi Bulan Berjalan (Okt)
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            {/* Proyeksi Bruto Prominent */}
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiahShort(runRateBruto.projectedMonthEnd)}
            </div>
            {/* Proyeksi Netto Subtext */}
            <div className="mt-1 text-sm font-medium text-slate-500">
              Netto: <span className="text-slate-700 font-semibold">{formatRupiahShort(runRateNetto.projectedMonthEnd)}</span>
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
            <span className="text-slate-500">Rata-rata: {formatRupiahShort(runRateBruto.avgPerDay)}/hari</span>
            <span className="text-[11px] text-sky-600 font-medium">Run-rate H-14</span>
          </div>
        </div>

        {/* Card 6: Kebutuhan Omzet / Hari */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Kebutuhan Omzet / Hari
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
            </div>
            {/* Kebutuhan Bruto Prominent */}
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiahShort(runRateBruto.requiredPerDay)}
              <span className="text-sm font-normal text-slate-400 ml-1">/hari</span>
            </div>
            {/* Netto Subtext */}
            <div className="mt-1 text-sm font-medium text-slate-500">
              Netto: <span className="text-slate-700 font-semibold">{formatRupiahShort(runRateNetto.requiredPerDay)}</span>/hari
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
            <span className="text-slate-500">Sisa 17 hari (s/d 31 Okt)</span>
            <span className="text-[11px] text-purple-600 font-medium">Harian Diperlukan</span>
          </div>
        </div>
      </div>

      {/* Elegant, Minimalist SKU Transparency Strip */}
      {skuCount > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-100">
              <Info className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Pengecualian {skuCount} SKU Penugasan Khusus
              </h4>
              <p className="text-xs text-slate-500">
                Pesanan proyek khusus dicatat terpisah dan tidak diperhitungkan dalam evaluasi target reguler.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 flex-wrap">
            <div className="text-xs">
              <span className="text-slate-400 mr-1.5">Bruto:</span>
              <strong className="text-slate-900 font-bold">{formatRupiahShort(summary.excluded_bruto)}</strong>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 mr-1.5">Netto:</span>
              <strong className="text-slate-900 font-bold">{formatRupiahShort(summary.excluded_netto)}</strong>
            </div>
            <button
              onClick={onOpenSkuModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer pl-2 border-l border-slate-200"
            >
              Rincian SKU &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Visual Analytics Section with Modern Elegant Accent Colors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Breakdown Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-700" />
                  Komparasi Forecast vs Realisasi per Bulan
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Perbandingan target terhadap realisasi pesanan Q4 2026
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="text-slate-500">Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  <span className="text-slate-700 font-medium">Bruto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-500">Netto</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {summary.per_bulan.map((m) => {
                const maxVal = Math.max(m.forecast, m.pesanan_bruto, 1);
                const forecastWidth = (m.forecast / maxVal) * 100;
                const brutoWidth = (m.pesanan_bruto / maxVal) * 100;
                const nettoWidth = (m.pesanan_netto / maxVal) * 100;
                const style = getAchievementStyle(m.pct_bruto, false);

                return (
                  <div
                    key={m.bulan_no}
                    className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{m.bulan_name}</span>
                        {m.bulan_no === 10 && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200/60 font-semibold px-2 py-0.5 rounded-full">
                            Bulan Berjalan
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 tabular-nums">
                          {m.pct_bruto.toFixed(2)}%
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${style.bg} ${style.text}`}>
                          {style.label.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Bars for Forecast, Bruto, and Netto */}
                    <div className="space-y-2 pt-1">
                      {/* Forecast Bar */}
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-[11px] text-slate-400 shrink-0">Forecast</span>
                        <div className="flex-1 bg-slate-200/70 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-300 h-full rounded-full transition-all duration-300"
                            style={{ width: `${forecastWidth}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 w-24 text-right tabular-nums">
                          {formatRupiahShort(m.forecast)}
                        </span>
                      </div>

                      {/* Bruto Bar */}
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-[11px] font-semibold text-slate-700 shrink-0">Bruto</span>
                        <div className="flex-1 bg-slate-200/70 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-800 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(brutoWidth, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 w-24 text-right tabular-nums">
                          {formatRupiahShort(m.pesanan_bruto)}
                        </span>
                      </div>

                      {/* Netto Bar */}
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-[11px] text-slate-400 shrink-0">Netto</span>
                        <div className="flex-1 bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(nettoWidth, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 w-24 text-right tabular-nums">
                          {formatRupiahShort(m.pesanan_netto)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between text-xs text-slate-400">
                      <span>Defisit Bruto: <strong className="text-amber-700">{formatRupiahShort(m.gap_bruto)}</strong></span>
                      <span className="tabular-nums">Netto: {formatRupiahShort(m.pesanan_netto)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Principal Achievement Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  Pencapaian per Principal
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  % Capaian terhadap Forecast PO
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {principalBreakdown.map((item) => {
                const style = getAchievementStyle(item.pct_bruto, item.forecast === 0 && item.pesanan_bruto > 0);
                const barWidth = Math.min(Math.max(item.pct_bruto, 0), 100);

                return (
                  <div
                    key={item.name}
                    onClick={() => onSelectPrincipalFilter?.(item.name)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                    title={`Filter ${item.name}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 w-16">{item.name}</span>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {formatRupiahShort(item.pesanan_bruto)}
                        </span>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          (Net: {formatRupiahShort(item.pesanan_netto)})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 tabular-nums">
                          {item.pct_bruto.toFixed(1)}%
                        </span>
                        <span className={`w-2 h-2 rounded-full ${style.progressBarColor}`} />
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
    </div>
  );
};
