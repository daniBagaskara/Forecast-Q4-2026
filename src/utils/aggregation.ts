import { FactRecord, SummaryResponse, PerBulanSummary } from '../types';

/**
 * Aggregates fact records by applying filters and computing summary KPIs & monthly breakdowns.
 * Runs instantly on the client side using the loaded fact records.
 */
export function calculateAggregatedSummary(
  facts: FactRecord[],
  bulan_no?: number | null,
  am_code?: string | null,
  bo_code?: string | null,
  principal?: string | null
): SummaryResponse {
  const filtered = facts.filter((f) => {
    if (bulan_no && f.bulan_no !== bulan_no) return false;
    if (am_code && f.am_code !== am_code) return false;
    if (bo_code && f.bo_code !== bo_code) return false;
    if (principal && f.principal !== principal) return false;
    return true;
  });

  const totalForecast = filtered.reduce((acc, f) => acc + (f.forecast || 0), 0);
  const totalPesananBruto = filtered.reduce((acc, f) => acc + (f.pesanan_bruto || 0), 0);
  const totalPesananNetto = filtered.reduce((acc, f) => acc + (f.pesanan_netto || 0), 0);

  const pctBruto = totalForecast > 0 ? (totalPesananBruto / totalForecast) * 100 : 0;
  const pctNetto = totalForecast > 0 ? (totalPesananNetto / totalForecast) * 100 : 0;

  const gapBruto = totalForecast - totalPesananBruto;
  const gapNetto = totalForecast - totalPesananNetto;

  // Excluded SKU values (4 SKU Sarana Keterampilan Menulis)
  // Base national excluded values: ~Rp 18.97 M Bruto / ~Rp 13.13 M Netto proportional to filter
  const filterRatio = totalForecast > 0 ? totalForecast / 255_369_233_102 : 1;
  const excludedBruto = Math.round(18_970_460_306 * filterRatio);
  const excludedNetto = Math.round(13_132_362_105 * filterRatio);

  const bulanNames: Record<number, string> = {
    10: 'Oktober',
    11: 'November',
    12: 'Desember',
  };

  const perBulan: PerBulanSummary[] = [10, 11, 12].map((bNo) => {
    const bFacts = filtered.filter((f) => f.bulan_no === bNo);
    const fc = bFacts.reduce((acc, f) => acc + (f.forecast || 0), 0);
    const pb = bFacts.reduce((acc, f) => acc + (f.pesanan_bruto || 0), 0);
    const pn = bFacts.reduce((acc, f) => acc + (f.pesanan_netto || 0), 0);
    return {
      bulan_no: bNo,
      bulan_name: bulanNames[bNo],
      forecast: fc,
      pesanan_bruto: pb,
      pesanan_netto: pn,
      pct_bruto: fc > 0 ? (pb / fc) * 100 : 0,
      pct_netto: fc > 0 ? (pn / fc) * 100 : 0,
      gap_bruto: fc - pb,
      gap_netto: fc - pn,
    };
  });

  return {
    forecast: totalForecast,
    pesanan_bruto: totalPesananBruto,
    pesanan_netto: totalPesananNetto,
    pct_bruto: Number(pctBruto.toFixed(2)),
    pct_netto: Number(pctNetto.toFixed(2)),
    gap_bruto: gapBruto,
    gap_netto: gapNetto,
    excluded_bruto: excludedBruto,
    excluded_netto: excludedNetto,
    per_bulan: perBulan,
  };
}
