import { MetaResponse, FactRecord, SummaryResponse, PerBulanSummary } from '../types';

export const mockMeta: MetaResponse = {
  year: 2026,
  last_sync_pesanan: '14 Okt 2026, 08:30 WIB',
  last_sync_forecast: '01 Okt 2026, 00:00 WIB',
  excluded_skus: [
    {
      code: 'SKU-SKM-01',
      name: 'Sarana Keterampilan Menulis - Jenjang SD/MI',
      category: 'Sarana Khusus',
      note: 'Dikecualikan dari perhitungan KPI komersial Q4 sesuai SK Direksi No. 042/DIR/IX/2026',
    },
    {
      code: 'SKU-SKM-02',
      name: 'Sarana Keterampilan Menulis - Jenjang SMP/MTs',
      category: 'Sarana Khusus',
      note: 'Dikecualikan dari perhitungan KPI komersial Q4 sesuai SK Direksi No. 042/DIR/IX/2026',
    },
    {
      code: 'SKU-SKM-03',
      name: 'Sarana Keterampilan Menulis - Jenjang SMA/MA',
      category: 'Sarana Khusus',
      note: 'Dikecualikan dari perhitungan KPI komersial Q4 sesuai SK Direksi No. 042/DIR/IX/2026',
    },
    {
      code: 'SKU-SKM-04',
      name: 'Sarana Keterampilan Menulis - Jenjang SMK/MAK',
      category: 'Sarana Khusus',
      note: 'Dikecualikan dari perhitungan KPI komersial Q4 sesuai SK Direksi No. 042/DIR/IX/2026',
    },
  ],
  ams: [
    { code: 'AM 01', name: 'Agus Setiadi (Sumbagut)' },
    { code: 'AM 02', name: 'Bambang Suherman (Sumbagsel)' },
    { code: 'AM 03', name: 'Candra Wijaya (DKI & Banten)' },
    { code: 'AM 04', name: 'Dedi Suryadi (Jawa Barat)' },
    { code: 'AM 05', name: 'Eko Prasetyo (Jateng & DIY)' },
    { code: 'AM 06', name: 'Fajar Nugroho (Jatim & Madura)' },
    { code: 'AM 07', name: 'Gusti Made Arya (Bali & Nusra)' },
    { code: 'AM 08', name: 'Hendra Gunawan (Kalimantan)' },
    { code: 'AM 09', name: 'Irfan Baharuddin (Sulawesi)' },
    { code: 'AM 10', name: 'Joko Marbun (Maluku & Papua)' },
  ],
  bos: [
    // AM 01
    { code: 'PACH', name: 'Banda Aceh', am_code: 'AM 01' },
    { code: 'PBRN', name: 'Bireuen', am_code: 'AM 01' },
    { code: 'PMDN', name: 'Medan', am_code: 'AM 01' },
    { code: 'PPST', name: 'Pematang Siantar', am_code: 'AM 01' },
    { code: 'PPBK', name: 'Padang', am_code: 'AM 01' },
    { code: 'PPKB', name: 'Pekanbaru', am_code: 'AM 01' },
    // AM 02
    { code: 'PPLG', name: 'Palembang', am_code: 'AM 02' },
    { code: 'PJMB', name: 'Jambi', am_code: 'AM 02' },
    { code: 'PBKL', name: 'Bengkulu', am_code: 'AM 02' },
    { code: 'PLPG', name: 'Bandar Lampung', am_code: 'AM 02' },
    { code: 'PPKP', name: 'Pangkal Pinang', am_code: 'AM 02' },
    // AM 03
    { code: 'PJBO', name: 'Jakarta Barat', am_code: 'AM 03' },
    { code: 'PJPU', name: 'Jakarta Pusat', am_code: 'AM 03' },
    { code: 'PJSM', name: 'Jakarta Selatan', am_code: 'AM 03' },
    { code: 'PJTM', name: 'Jakarta Timur', am_code: 'AM 03' },
    { code: 'PTNG', name: 'Tangerang', am_code: 'AM 03' },
    { code: 'PSRG', name: 'Serang', am_code: 'AM 03' },
    // AM 04
    { code: 'PBDG', name: 'Bandung', am_code: 'AM 04' },
    { code: 'PCBN', name: 'Cirebon', am_code: 'AM 04' },
    { code: 'PTAS', name: 'Tasikmalaya', am_code: 'AM 04' },
    { code: 'PBGR', name: 'Bogor', am_code: 'AM 04' },
    { code: 'PBKS', name: 'Bekasi', am_code: 'AM 04' },
    { code: 'PKRW', name: 'Karawang', am_code: 'AM 04' },
    // AM 05
    { code: 'PSMG', name: 'Semarang', am_code: 'AM 05' },
    { code: 'PSLO', name: 'Solo / Surakarta', am_code: 'AM 05' },
    { code: 'PJOG', name: 'Yogyakarta', am_code: 'AM 05' },
    { code: 'PPWT', name: 'Purwokerto', am_code: 'AM 05' },
    { code: 'PKDS', name: 'Kudus', am_code: 'AM 05' },
    { code: 'PTEG', name: 'Tegal', am_code: 'AM 05' },
    // AM 06
    { code: 'PSBY', name: 'Surabaya', am_code: 'AM 06' },
    { code: 'PMLG', name: 'Malang', am_code: 'AM 06' },
    { code: 'PKDR', name: 'Kediri', am_code: 'AM 06' },
    { code: 'PJBR', name: 'Jember', am_code: 'AM 06' },
    { code: 'PMDN2', name: 'Madiun', am_code: 'AM 06' },
    { code: 'PPKM', name: 'Pamekasan (Madura)', am_code: 'AM 06' },
    // AM 07
    { code: 'PDPS', name: 'Denpasar', am_code: 'AM 07' },
    { code: 'PMTR', name: 'Mataram (Lombok)', am_code: 'AM 07' },
    { code: 'PKPG', name: 'Kupang', am_code: 'AM 07' },
    { code: 'PEND', name: 'Ende (Flores)', am_code: 'AM 07' },
    // AM 08
    { code: 'PPNK', name: 'Pontianak', am_code: 'AM 08' },
    { code: 'PBJM', name: 'Banjarmasin', am_code: 'AM 08' },
    { code: 'PSMD', name: 'Samarinda', am_code: 'AM 08' },
    { code: 'PBLP', name: 'Balikpapan', am_code: 'AM 08' },
    { code: 'PPLK', name: 'Palangka Raya', am_code: 'AM 08' },
    // AM 09
    { code: 'PMKS', name: 'Makassar', am_code: 'AM 09' },
    { code: 'PMND', name: 'Manado', am_code: 'AM 09' },
    { code: 'PPAL', name: 'Palu', am_code: 'AM 09' },
    { code: 'PKDI', name: 'Kendari', am_code: 'AM 09' },
    { code: 'PGRO', name: 'Gorontalo', am_code: 'AM 09' },
    // AM 10
    { code: 'PAMP', name: 'Ambon', am_code: 'AM 10' },
    { code: 'PTNT', name: 'Ternate', am_code: 'AM 10' },
    { code: 'PJYP', name: 'Jayapura', am_code: 'AM 10' },
    { code: 'PSRG2', name: 'Sorong', am_code: 'AM 10' },
    { code: 'PMRK', name: 'Merauke', am_code: 'AM 10' },
  ],
  principals: ['ATS', 'IPE', 'PPL', 'SKE', 'SMK', 'SSE', 'PIM', 'SKP', 'Lain-lain'],
};

// Seeded pseudorandom generator for deterministic, consistent realistic data
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateMockFacts(): FactRecord[] {
  const facts: FactRecord[] = [];
  const principals = mockMeta.principals;
  const bos = mockMeta.bos;
  const amMap = new Map(mockMeta.ams.map((a) => [a.code, a.name]));

  // Principal weightings in business
  const principalWeights: Record<string, number> = {
    ATS: 0.28,
    IPE: 0.22,
    PPL: 0.16,
    SKE: 0.11,
    SMK: 0.09,
    SSE: 0.06,
    PIM: 0.04,
    SKP: 0.025,
    'Lain-lain': 0.015,
  };

  // Monthly forecast share in Q4: Okt ~36.5%, Nov ~34.1%, Des ~29.4%
  const monthShare: Record<number, number> = {
    10: 0.36476,
    11: 0.34151,
    12: 0.29373,
  };

  // Target total forecast Q4 ~ Rp 255.369.233.102
  const targetTotalForecast = 255_369_233_102;
  const basePerBo = targetTotalForecast / (bos.length * 3); // per BO per month

  let seed = 12345;

  for (const bo of bos) {
    const amName = amMap.get(bo.am_code) || bo.am_code;

    // BO scale multiplier (tier 1 major cities vs smaller branches)
    let boMultiplier = 1.0;
    if (['PSBY', 'PSMG', 'PBDG', 'PJBO', 'PMDN', 'PSLO', 'PJOG'].includes(bo.code)) {
      boMultiplier = 1.9;
    } else if (['PMKS', 'PDPS', 'PBKS', 'PTNG', 'PPLG', 'PSMD'].includes(bo.code)) {
      boMultiplier = 1.4;
    } else if (['PBRN', 'PKDS', 'PPST', 'PPKP', 'PEND', 'PMRK'].includes(bo.code)) {
      boMultiplier = 0.55;
    }

    // Special edge-case branch: PPKP (Pangkal Pinang) has 1 principal with pesanan but 0 forecast
    // to test "Cabang dengan Pesanan Tanpa Forecast" requirement!
    const isSpecialZeroForecast = bo.code === 'PPKP';

    for (let bulan = 10; bulan <= 12; bulan++) {
      const isCurrentMonth = bulan === 10;
      const mShare = monthShare[bulan];

      for (const pr of principals) {
        seed++;
        const prWeight = principalWeights[pr] || 0.05;
        const randVariation = 0.75 + pseudoRandom(seed) * 0.5;

        // Baseline forecast for this slice
        let forecast = Math.round(basePerBo * boMultiplier * prWeight * (mShare / 0.33) * randVariation);

        // Round to nearest 100,000 for realistic financial planning
        forecast = Math.round(forecast / 100_000) * 100_000;

        // PPKP in Oct on principal SKP: 0 forecast but has orders
        if (isSpecialZeroForecast && pr === 'SKP') {
          forecast = 0;
        }

        // Orders: In Oct (month 10), realization is in progress (overall ~32.69% in Oct, which is ~11.92% of Q4)
        // Nov and Dec are future months (Pesanan = 0 or early indent orders)
        let pesananBruto = 0;
        let pesananNetto = 0;
        let pesananQty = 0;

        if (isCurrentMonth) {
          // In October (mid-month day 14):
          // Achievement variance across branches: some top performers 45-60%, some lagging 15-25%
          let performanceFactor = 0.3269;
          const amIndex = parseInt(bo.am_code.replace('AM ', ''), 10);
          if (amIndex <= 4) performanceFactor += 0.06; // western regions slightly ahead
          if (bo.code === 'PSLO' || bo.code === 'PBDG') performanceFactor = 0.52; // high achiever
          if (bo.code === 'PACH' || bo.code === 'PBRN') performanceFactor = 0.18; // lagging

          const randPerf = performanceFactor * (0.8 + pseudoRandom(seed + 99) * 0.4);

          if (forecast > 0) {
            pesananNetto = Math.round(forecast * randPerf);
          } else if (isSpecialZeroForecast && pr === 'SKP') {
            // Unforecasted order: Rp 38.500.000
            pesananNetto = 38_500_000;
          }

          // Netto to Bruto ratio: Gross is ~1.437x Netto (discounts/retur deductions)
          const brutoMultiplier = 1.38 + pseudoRandom(seed + 50) * 0.12;
          pesananBruto = Math.round(pesananNetto * brutoMultiplier);
          pesananQty = Math.round(pesananNetto / 85_000); // average price ~85k
        } else {
          // Nov / Dec: very tiny early advanced bookings (<1%)
          if (pseudoRandom(seed + 15) > 0.85) {
            pesananNetto = Math.round(forecast * 0.012);
            pesananBruto = Math.round(pesananNetto * 1.4);
            pesananQty = Math.round(pesananNetto / 85_000);
          }
        }

        facts.push({
          bulan_no: bulan,
          am_code: bo.am_code,
          am_name: amName,
          bo_code: bo.code,
          bo_name: bo.name,
          principal: pr,
          forecast,
          pesanan_bruto: pesananBruto,
          pesanan_netto: pesananNetto,
          pesanan_qty: pesananQty,
        });
      }
    }
  }

  return facts;
}

export const mockFacts: FactRecord[] = generateMockFacts();

export { calculateAggregatedSummary, calculateAggregatedSummary as calculateMockSummary } from '../utils/aggregation';

