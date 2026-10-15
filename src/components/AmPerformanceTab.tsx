import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building,
  ChevronRight,
} from 'lucide-react';
import { FactRecord, MetaResponse } from '../types';
import {
  formatThousand,
  formatPercentValue,
  getAchievementStyle,
} from '../utils/formatters';
import { exportToExcel } from '../services/export';

interface AmPerformanceTabProps {
  facts: FactRecord[];
  meta: MetaResponse | null;
  onSelectAm: (amCode: string) => void;
}

type SortField = 'am_code' | 'am_name' | 'bo_count' | 'forecast' | 'pesanan_bruto' | 'pct_bruto' | 'gap_bruto';

export const AmPerformanceTab: React.FC<AmPerformanceTabProps> = ({
  facts,
  meta,
  onSelectAm,
}) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('pct_bruto');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Count unique BOs per AM from meta
  const boCountMap = useMemo(() => {
    const map = new Map<string, number>();
    meta?.bos?.forEach((b) => {
      map.set(b.am_code, (map.get(b.am_code) || 0) + 1);
    });
    return map;
  }, [meta?.bos]);

  // Aggregate facts by AM with unified Bruto and Netto
  const amData = useMemo(() => {
    const map = new Map<
      string,
      {
        am_code: string;
        am_name: string;
        forecast: number;
        pesanan_bruto: number;
        pesanan_netto: number;
      }
    >();

    facts.forEach((f) => {
      const current = map.get(f.am_code) || {
        am_code: f.am_code,
        am_name: f.am_name,
        forecast: 0,
        pesanan_bruto: 0,
        pesanan_netto: 0,
      };
      map.set(f.am_code, {
        ...current,
        forecast: current.forecast + (f.forecast || 0),
        pesanan_bruto: current.pesanan_bruto + (f.pesanan_bruto || 0),
        pesanan_netto: current.pesanan_netto + (f.pesanan_netto || 0),
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
      const boCount = boCountMap.get(item.am_code) || 0;

      return {
        ...item,
        bo_count: boCount,
        pct_bruto: pctBruto ?? -1,
        pct_bruto_label: pctBrutoLabel,
        pct_netto: pctNetto ?? -1,
        pct_netto_label: pctNettoLabel,
        isWithoutForecast,
        gap_bruto: gapBruto,
        gap_netto: gapNetto,
      };
    });
  }, [facts, boCountMap]);

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    return amData
      .filter((row) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          row.am_code.toLowerCase().includes(q) ||
          row.am_name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'am_code') cmp = a.am_code.localeCompare(b.am_code);
        else if (sortField === 'am_name') cmp = a.am_name.localeCompare(b.am_name);
        else if (sortField === 'bo_count') cmp = a.bo_count - b.bo_count;
        else if (sortField === 'forecast') cmp = a.forecast - b.forecast;
        else if (sortField === 'pesanan_bruto') cmp = a.pesanan_bruto - b.pesanan_bruto;
        else if (sortField === 'pct_bruto') cmp = a.pct_bruto - b.pct_bruto;
        else if (sortField === 'gap_bruto') cmp = a.gap_bruto - b.gap_bruto;

        return sortDirection === 'asc' ? cmp : -cmp;
      });
  }, [amData, search, sortField, sortDirection]);

  // Handle sort toggling
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

  // Export handler
  const handleExport = () => {
    exportToExcel(
      filteredAndSorted,
      [
        { header: 'Kode AM', key: 'am_code' },
        { header: 'Nama Area Manager & Wilayah', key: 'am_name' },
        { header: 'Jumlah Cabang (BO)', key: 'bo_count' },
        { header: 'Target Forecast PO (Rp)', key: 'forecast', format: (r) => r.forecast },
        { header: 'Pesanan Bruto (Rp)', key: 'pesanan_bruto', format: (r) => r.pesanan_bruto },
        { header: 'Pesanan Netto (Rp)', key: 'pesanan_netto', format: (r) => r.pesanan_netto },
        { header: '% Capai Bruto', key: 'pct_bruto', format: (r) => r.pct_bruto_label },
        { header: '% Capai Netto', key: 'pct_netto', format: (r) => r.pct_netto_label },
        { header: 'Gap Bruto (Rp)', key: 'gap_bruto', format: (r) => r.gap_bruto },
      ],
      `Kinerja_AM_Q4_2026`,
      'Kinerja AM'
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode AM atau nama wilayah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Total AM: <strong className="text-slate-900">{filteredAndSorted.length}</strong>
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
                  onClick={() => handleSort('am_code')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors w-28"
                >
                  Kode AM {renderSortIcon('am_code')}
                </th>
                <th
                  onClick={() => handleSort('am_name')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  Wilayah / Area Manager {renderSortIcon('am_name')}
                </th>
                <th
                  onClick={() => handleSort('bo_count')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100/70 transition-colors w-24"
                >
                  Cabang {renderSortIcon('bo_count')}
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
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors min-w-[200px]"
                >
                  % Capaian {renderSortIcon('pct_bruto')}
                </th>
                <th
                  onClick={() => handleSort('gap_bruto')}
                  className="py-3.5 px-5 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  Defisit / Gap {renderSortIcon('gap_bruto')}
                </th>
                <th className="py-3.5 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAndSorted.map((row) => {
                const style = getAchievementStyle(row.pct_bruto >= 0 ? row.pct_bruto : null, row.isWithoutForecast);
                const progressWidth = row.pct_bruto >= 0 ? Math.min(Math.max(row.pct_bruto, 0), 100) : 0;

                return (
                  <tr
                    key={row.am_code}
                    onClick={() => onSelectAm(row.am_code)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 px-2.5 py-1 rounded-lg transition-colors">
                        {row.am_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                        <span className="font-semibold">{row.am_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                      {row.bo_count} BO
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
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAm(row.am_code);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-indigo-600 group-hover:underline"
                      >
                        <span>Lihat BO</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada data Area Manager yang sesuai pencarian.
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
