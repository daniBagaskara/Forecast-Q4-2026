import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Store,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FactRecord } from '../types';
import {
  formatThousand,
  formatPercentValue,
  getAchievementStyle,
} from '../utils/formatters';
import { exportToExcel } from '../services/export';

interface BoPerformanceTabProps {
  facts: FactRecord[];
  onOpenBoDrawer: (boCode: string) => void;
}

type SortField = 'bo_code' | 'bo_name' | 'am_code' | 'forecast' | 'pesanan_bruto' | 'pct_bruto' | 'gap_bruto';

export const BoPerformanceTab: React.FC<BoPerformanceTabProps> = ({
  facts,
  onOpenBoDrawer,
}) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('pct_bruto');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Aggregate facts by BO with unified Bruto and Netto
  const boData = useMemo(() => {
    const map = new Map<
      string,
      {
        bo_code: string;
        bo_name: string;
        am_code: string;
        am_name: string;
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
        am_name: f.am_name,
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

      return {
        ...item,
        pct_bruto: pctBruto ?? -1,
        pct_bruto_label: pctBrutoLabel,
        pct_netto: pctNetto ?? -1,
        pct_netto_label: pctNettoLabel,
        isWithoutForecast,
        gap_bruto: gapBruto,
        gap_netto: gapNetto,
      };
    });
  }, [facts]);

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    return boData
      .filter((row) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          row.bo_code.toLowerCase().includes(q) ||
          row.bo_name.toLowerCase().includes(q) ||
          row.am_code.toLowerCase().includes(q) ||
          row.am_name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'bo_code') cmp = a.bo_code.localeCompare(b.bo_code);
        else if (sortField === 'bo_name') cmp = a.bo_name.localeCompare(b.bo_name);
        else if (sortField === 'am_code') cmp = a.am_code.localeCompare(b.am_code);
        else if (sortField === 'forecast') cmp = a.forecast - b.forecast;
        else if (sortField === 'pesanan_bruto') cmp = a.pesanan_bruto - b.pesanan_bruto;
        else if (sortField === 'pct_bruto') cmp = a.pct_bruto - b.pct_bruto;
        else if (sortField === 'gap_bruto') cmp = a.gap_bruto - b.gap_bruto;

        return sortDirection === 'asc' ? cmp : -cmp;
      });
  }, [boData, search, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  // Handle sort toggling
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
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
        { header: 'Kode BO', key: 'bo_code' },
        { header: 'Nama Cabang (BO)', key: 'bo_name' },
        { header: 'Kode AM', key: 'am_code' },
        { header: 'Wilayah AM', key: 'am_name' },
        { header: 'Target Forecast PO (Rp)', key: 'forecast', format: (r) => r.forecast },
        { header: 'Pesanan Bruto (Rp)', key: 'pesanan_bruto', format: (r) => r.pesanan_bruto },
        { header: 'Pesanan Netto (Rp)', key: 'pesanan_netto', format: (r) => r.pesanan_netto },
        { header: '% Capai Bruto', key: 'pct_bruto', format: (r) => r.pct_bruto_label },
        { header: '% Capai Netto', key: 'pct_netto', format: (r) => r.pct_netto_label },
        { header: 'Gap Bruto (Rp)', key: 'gap_bruto', format: (r) => r.gap_bruto },
      ],
      `Kinerja_Cabang_BO_Q4_2026`,
      'Kinerja BO'
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
            placeholder="Cari kode BO, nama cabang, atau AM..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs text-slate-700"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Total: <strong className="text-slate-900">{filteredAndSorted.length}</strong> Cabang
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
                  onClick={() => handleSort('bo_code')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors w-24"
                >
                  Kode BO {renderSortIcon('bo_code')}
                </th>
                <th
                  onClick={() => handleSort('bo_name')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  Nama Cabang (BO) {renderSortIcon('bo_name')}
                </th>
                <th
                  onClick={() => handleSort('am_code')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors w-28"
                >
                  Area (AM) {renderSortIcon('am_code')}
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
                <th className="py-3.5 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((row) => {
                const style = getAchievementStyle(row.pct_bruto >= 0 ? row.pct_bruto : null, row.isWithoutForecast);
                const progressWidth = row.pct_bruto >= 0 ? Math.min(Math.max(row.pct_bruto, 0), 100) : 0;

                return (
                  <tr
                    key={row.bo_code}
                    onClick={() => onOpenBoDrawer(row.bo_code)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 px-2.5 py-1 rounded-lg transition-colors">
                        {row.bo_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                        <span className="font-semibold">{row.bo_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {row.am_code}
                      </span>
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
                          onOpenBoDrawer(row.bo_code);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-indigo-600 group-hover:underline"
                      >
                        <span>Detail BO</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada data Cabang yang sesuai dengan pencarian atau filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredAndSorted.length} Total Data)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-2xs"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2.5 font-medium text-slate-700">
                {currentPage} / {totalPages}
              </div>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-2xs"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
