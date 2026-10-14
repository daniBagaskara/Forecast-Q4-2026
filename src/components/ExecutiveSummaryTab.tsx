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
  onOpenSkuModal: () => void;
  onSelectPrincipalFilter?: (pr: string) => void;
}

export const ExecutiveSummaryTab: React.FC<ExecutiveSummaryTabProps> = ({
  summary,
  facts,
  metric,
  onOpenSkuModal,
  onSelectPrincipalFilter,
}) => {
  const isNetto = metric === 'netto';
  const pesananTotal = isNetto ? summary.pesanan_netto : summary.pesanan_bruto;
  const pctTotal = isNetto ? summary.pct_netto : summary.pct_bruto;
  const gapTotal = isNetto ? summary.gap_netto : summary.gap_bruto;

  const achievementStyle = getAchievementStyle(pctTotal, summary.forecast === 0 && pesananTotal > 0);

  // Oktober Run-rate calculation
  const oktSummary = summary.per_bulan.find((b) => b.bulan_no === 10);
  const oktForecast = oktSummary?.forecast || 0;
  const oktPesanan = isNetto ? (oktSummary?.pesanan_netto || 0) : (oktSummary?.pesanan_bruto || 0);

  // Current day is 14 Oktober 2026 out of 31 days
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
    <div className="space-y-6">
      {/* 6 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Target Forecast */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Forecast PO</span>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {formatRupiahShort(summary.forecast)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate" title={`Rp ${formatThousand(summary.forecast)}`}>
            Rp {formatThousand(summary.forecast)}
          </p>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            Alokasi Total Q4 2026
          </div>
        </div>

        {/* Card 2: Realisasi Pesanan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Realisasi ({isNetto ? 'Netto' : 'Bruto'})
            </span>
            <ShoppingCart className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-indigo-600 tracking-tight">
            {formatRupiahShort(pesananTotal)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate" title={`Rp ${formatThousand(pesananTotal)}`}>
            Rp {formatThousand(pesananTotal)}
          </p>
          <div className="mt-2 text-[10px] text-indigo-600 font-medium">
            Sales Order Terkonfirmasi
          </div>
        </div>

        {/* Card 3: % Pencapaian */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">% Capaian Total</span>
            <Percent className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {pctTotal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${achievementStyle.bg} ${achievementStyle.text} ${achievementStyle.border}`}
            >
              {achievementStyle.label}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            vs Target Forecast Q4
          </div>
        </div>

        {/* Card 4: Gap / Selisih */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gap / Defisit</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-700 tracking-tight">
            {formatRupiahShort(gapTotal)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate" title={`Rp ${formatThousand(gapTotal)}`}>
            Rp {formatThousand(gapTotal)}
          </p>
          <div className="mt-2 text-[10px] text-amber-600 font-medium">
            Kekurangan s/d Akhir Q4
          </div>
        </div>

        {/* Card 5: Proyeksi Akhir Bulan (Run-rate) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Proyeksi Okt (RR)</span>
            <Compass className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-sky-700 tracking-tight">
            {formatRupiahShort(runRate.projectedMonthEnd)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Est. {runRate.projectedPct.toFixed(1)}% target Okt
          </p>
          <div className="mt-2 text-[10px] text-slate-400">
            Rata-rata: {formatRupiahShort(runRate.avgPerDay)}/hari
          </div>
        </div>

        {/* Card 6: Kebutuhan Omzet/Hari */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Butuh/Hari</span>
            <CalendarCheck2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-700 tracking-tight">
            {formatRupiahShort(runRate.requiredPerDay)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Sisa 17 hari (s/d 31 Okt)
          </p>
          <div className="mt-2 text-[10px] text-purple-600 font-medium">
            Kebutuhan Harian Okt
          </div>
        </div>
      </div>

      {/* Info Card: Transparansi 4 SKU Excluded */}
      <div className="bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 border border-sky-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Transparansi Pengecualian 4 SKU Sarana Keterampilan Menulis
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Pesanan produk penugasan afirmasi ini dicatat terpisah dan <strong>tidak dimasukkan</strong> dalam
              perhitungan % capaian komersial reguler. Nilai pesanan terealisasi:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">Excluded Netto</span>
            <span className="text-sm font-bold text-slate-900">{formatRupiahShort(summary.excluded_netto)}</span>
          </div>
          <div className="bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">Excluded Bruto</span>
            <span className="text-sm font-bold text-slate-900">{formatRupiahShort(summary.excluded_bruto)}</span>
          </div>
          <button
            onClick={onOpenSkuModal}
            className="px-3 py-2 text-xs font-semibold text-sky-700 bg-sky-100/70 hover:bg-sky-200/80 rounded-lg transition-colors cursor-pointer"
          >
            Lihat 4 SKU &rarr;
          </button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Grouped Bars Forecast vs Pesanan per Bulan (Okt, Nov, Des) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Komparasi Forecast vs Realisasi per Bulan Q4
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Realisasi berbasis {isNetto ? 'Pesanan Netto' : 'Pesanan Bruto'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-300" />
                  <span className="text-slate-600 font-medium">Forecast PO</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-indigo-600" />
                  <span className="text-slate-600 font-medium">Realisasi</span>
                </div>
              </div>
            </div>

            {/* Monthly Comparison Cards and Visual Bars */}
            <div className="space-y-4 pt-2">
              {summary.per_bulan.map((m) => {
                const pesananVal = isNetto ? m.pesanan_netto : m.pesanan_bruto;
                const pctVal = isNetto ? m.pct_netto : m.pct_bruto;
                const gapVal = isNetto ? m.gap_netto : m.gap_bruto;
                const maxVal = Math.max(m.forecast, pesananVal, 1);
                const forecastWidth = (m.forecast / maxVal) * 100;
                const pesananWidth = (pesananVal / maxVal) * 100;
                const style = getAchievementStyle(pctVal, false);

                return (
                  <div key={m.bulan_no} className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{m.bulan_name} 2026</span>
                        {m.bulan_no === 10 && (
                          <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded">
                            Bulan Berjalan (H-14)
                          </span>
                        )}
                        {m.bulan_no > 10 && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded">
                            Periode Mendatang
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">
                          {pctVal.toFixed(2)}%
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${style.bg} ${style.text}`}>
                          {style.label.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Bars */}
                    <div className="space-y-1.5">
                      {/* Forecast Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-[10px] font-medium text-slate-500 shrink-0">Forecast:</span>
                        <div className="flex-1 bg-slate-200/80 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${forecastWidth}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 w-24 text-right tabular-nums">
                          {formatRupiahShort(m.forecast)}
                        </span>
                      </div>

                      {/* Realisasi Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-[10px] font-medium text-slate-500 shrink-0">Realisasi:</span>
                        <div className="flex-1 bg-slate-200/80 h-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${style.progressBarColor}`}
                            style={{ width: `${Math.min(pesananWidth, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-indigo-700 w-24 text-right tabular-nums">
                          {formatRupiahShort(pesananVal)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Gap/Defisit: <strong className="text-amber-700">{formatRupiahShort(gapVal)}</strong></span>
                      <span className="tabular-nums">Rp {formatThousand(pesananVal)} / Rp {formatThousand(m.forecast)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Chart: % Pencapaian per Principal */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  % Pencapaian per Principal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik baris untuk memfilter data principal
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {principalBreakdown.map((item) => {
                const style = getAchievementStyle(item.pct, item.forecast === 0 && item.pesanan > 0);
                const barWidth = Math.min(Math.max(item.pct, 0), 100);

                return (
                  <div
                    key={item.name}
                    onClick={() => onSelectPrincipalFilter?.(item.name)}
                    className="p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                    title={`Klik untuk memfilter Principal ${item.name}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 w-16">{item.name}</span>
                        <span className="text-[11px] text-slate-500">
                          {formatRupiahShort(item.pesanan)} / {formatRupiahShort(item.forecast)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 tabular-nums">
                          {item.pct.toFixed(1)}%
                        </span>
                        <span className={`w-2 h-2 rounded-full ${style.progressBarColor}`} />
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${style.progressBarColor}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Standar warna: Merah &lt;50% · Oranye &lt;80% · Hijau &ge;80%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
