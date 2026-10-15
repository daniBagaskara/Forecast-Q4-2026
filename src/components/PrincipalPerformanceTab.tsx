import React, { useState, useMemo } from 'react';
import {
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Briefcase,
} from 'lucide-react';
import { FactRecord } from '../types';
import {
  formatThousand,
  formatPercentValue,
  getAchievementStyle,
} from '../utils/formatters';
import { exportToExcel } from '../services/export';

interface PrincipalPerformanceTabProps {
  facts: FactRecord[];
}

type SortField = 'principal' | 'forecast' | 'pesanan_bruto' | 'pct_bruto' | 'gap_bruto' | 'share' | 'qty';

export const PrincipalPerformanceTab: React.FC<PrincipalPerformanceTabProps> = ({
  facts,
}) => {
  const [sortField, setSortField] = useState<SortField>('pesanan_bruto');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Total sales for calculating share percentage
  const totalPesananBrutoAll = useMemo(() => {
    return facts.reduce((acc, f) => acc + (f.pesanan_bruto || 0), 0);
  }, [facts]);

  // Aggregate by Principal with unified Bruto & Netto
  const principalData = useMemo(() => {
    const map = new Map<
      string,
      {
        principal: string;
        forecast: number;
        pesanan_bruto: number;
        pesanan_netto: number;
        qty: number;
      }
    >();

    facts.forEach((f) => {
      const current = map.get(f.principal) || {
        principal: f.principal,
        forecast: 0,
        pesanan_bruto: 0,
        pesanan_netto: 0,
        qty: 0,
      };
      map.set(f.principal, {
        principal: f.principal,
        forecast: current.forecast + (f.forecast || 0),
        pesanan_bruto: current.pesanan_bruto + (f.pesanan_bruto || 0),
        pesanan_netto: current.pesanan_netto + (f.pesanan_netto || 0),
        qty: current.qty + (f.pesanan_qty || 0),
      });
    });

    return Array.from(map.values()).map((item) => {
      const { pct: pctBruto, label: pctBrutoLabel, isWithoutForecast } = formatPercentValue(
        item.pesanan_bruto,
        item.forecast
      );
      const { pct: pctNetto, label: pctNettoLabel } = formatPercentValue(
        item.pesanan_netto,
        item.forecast
      );
      const gapBruto = item.forecast - item.pesanan_bruto;
      const gapNetto = item.forecast - item.pesanan_netto;
      const share = totalPesananBrutoAll > 0 ? (item.pesanan_bruto / totalPesananBrutoAll) * 100 : 0;

      return {
        ...item,
        pct_bruto: pctBruto ?? -1,
        pct_bruto_label: pctBrutoLabel,
        pct_netto: pctNetto ?? -1,
        pct_netto_label: pctNettoLabel,
        isWithoutForecast,
        gap_bruto: gapBruto,
        gap_netto: gapNetto,
        share,
      };
    });
  }, [facts, totalPesananBrutoAll]);

  // Sort
  const sortedData = useMemo(() => {
    return [...principalData].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'principal') cmp = a.principal.localeCompare(b.principal);
      else if (sortField === 'forecast') cmp = a.forecast - b.forecast;
      else if (sortField === 'pesanan_bruto') cmp = a.pesanan_bruto - b.pesanan_bruto;
      else if (sortField === 'pct_bruto') cmp = a.pct_bruto - b.pct_bruto;
      else if (sortField === 'gap_bruto') cmp = a.gap_bruto - b.gap_bruto;
      else if (sortField === 'share') cmp = a.share - b.share;
      else if (sortField === 'qty') cmp = a.qty - b.qty;

      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [principalData, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 inline ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-slate-900 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-slate-900 inline ml-1" />
    );
  };

  const handleExport = () => {
    exportToExcel(
      sortedData,
      [
        { header: 'Kode Principal', key: 'principal' },
        { header: 'Target Forecast PO (Rp)', key: 'forecast', format: (r) => r.forecast },
        { header: 'Pesanan Bruto (Rp)', key: 'pesanan_bruto', format: (r) => r.pesanan_bruto },
        { header: 'Pesanan Netto (Rp)', key: 'pesanan_netto', format: (r) => r.pesanan_netto },
        { header: '% Capai Bruto', key: 'pct_bruto', format: (r) => r.pct_bruto_label },
        { header: '% Capai Netto', key: 'pct_netto', format: (r) => r.pct_netto_label },
        { header: 'Gap Bruto (Rp)', key: 'gap_bruto', format: (r) => r.gap_bruto },
        {
          header: '% Kontribusi Penjualan',
          key: 'share',
          format: (r) => `${r.share.toFixed(2)}%`,
        },
        { header: 'Volume (Qty)', key: 'qty', format: (r) => r.qty },
      ],
      `Kinerja_Principal_Q4_2026`,
      'Kinerja Principal'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Matriks Komparasi Realisasi &amp; Target Seluruh Principal
            </h3>
            <p className="text-xs text-slate-400">
              Evaluasi kinerja produk dan kontribusi terhadap total omzet penjualan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            {sortedData.length} Principal Aktif
          </span>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th
                  onClick={() => handleSort('principal')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors w-32"
                >
                  Principal {renderSortIcon('principal')}
                </th>
                <th
                  onClick={() => handleSort('forecast')}
                  className="py-3.5 px-5 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  Target Forecast {renderSortIcon('forecast')}
                </th>
                <th
                  onClick={() => handleSort('pesanan_bruto')}
                  className="py-3.5 px-5 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  Pesanan (Bruto &amp; Netto) {renderSortIcon('pesanan_bruto')}
                </th>
                <th
                  onClick={() => handleSort('pct_bruto')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors min-w-[180px]"
                >
                  % Capaian {renderSortIcon('pct_bruto')}
                </th>
                <th
                  onClick={() => handleSort('gap_bruto')}
                  className="py-3.5 px-5 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  Defisit / Gap {renderSortIcon('gap_bruto')}
                </th>
                <th
                  onClick={() => handleSort('share')}
                  className="py-3.5 px-5 text-right cursor-pointer hover:bg-slate-100/70 transition-colors w-36"
                >
                  Kontribusi Penjualan {renderSortIcon('share')}
                </th>
                <th
                  onClick={() => handleSort('qty')}
                  className="py-3.5 px-5 text-right cursor-pointer hover:bg-slate-100/70 transition-colors w-28"
                >
                  Volume (Qty) {renderSortIcon('qty')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedData.map((row) => {
                const style = getAchievementStyle(row.pct_bruto >= 0 ? row.pct_bruto : null, row.isWithoutForecast);
                const progressWidth = row.pct_bruto >= 0 ? Math.min(Math.max(row.pct_bruto, 0), 100) : 0;

                return (
                  <tr key={row.principal} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-slate-900" />
                        <span className="font-mono text-sm tracking-tight">{row.principal}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right font-medium text-slate-800 tabular-nums">
                      {formatThousand(row.forecast, true)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {/* Bruto Prominent */}
                      <div className="font-bold text-slate-900 tabular-nums">
                        {formatThousand(row.pesanan_bruto, true)}
                      </div>
                      {/* Netto Subtext */}
                      <div className="text-[11px] text-slate-400 font-normal tabular-nums mt-0.5">
                        Netto: {formatThousand(row.pesanan_netto, true)}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                            {row.pct_bruto_label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Netto: {row.pct_netto_label}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${style.progressBarColor}`}
                            style={{ width: `${progressWidth}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="font-bold text-amber-700 tabular-nums">
                        {formatThousand(row.gap_bruto, true)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal tabular-nums mt-0.5">
                        Netto: {formatThousand(row.gap_netto, true)}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-slate-800 tabular-nums">
                          {row.share.toFixed(2)}%
                        </span>
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-900 h-full rounded-full"
                            style={{ width: `${Math.min(row.share * 2.5, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right text-slate-700 tabular-nums font-medium">
                      {formatThousand(row.qty)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
