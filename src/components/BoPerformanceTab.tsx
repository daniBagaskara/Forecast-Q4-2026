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
  SlidersHorizontal,
} from 'lucide-react';
import { FactRecord, MetricType } from '../types';
import {
  formatThousand,
  formatPercentValue,
  getAchievementStyle,
} from '../utils/formatters';
import { exportToExcel } from '../services/export';

interface BoPerformanceTabProps {
  facts: FactRecord[];
  metric: MetricType;
  onOpenBoDrawer: (boCode: string) => void;
}

type SortField = 'bo_code' | 'bo_name' | 'am_code' | 'forecast' | 'pesanan' | 'pct' | 'gap';

export const BoPerformanceTab: React.FC<BoPerformanceTabProps> = ({
  facts,
  metric,
  onOpenBoDrawer,
}) => {
  const isNetto = metric === 'netto';
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('pct');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Aggregate facts by BO
  const boData = useMemo(() => {
    const map = new Map<
      string,
      {
        bo_code: string;
        bo_name: string;
        am_code: string;
        am_name: string;
        forecast: number;
        pesanan: number;
      }
    >();

    facts.forEach((f) => {
      const current = map.get(f.bo_code) || {
        bo_code: f.bo_code,
        bo_name: f.bo_name,
        am_code: f.am_code,
        am_name: f.am_name,
        forecast: 0,
        pesanan: 0,
      };
      const val = isNetto ? f.pesanan_netto : f.pesanan_bruto;
      map.set(f.bo_code, {
        ...current,
        forecast: current.forecast + f.forecast,
        pesanan: current.pesanan + val,
      });
    });

    return Array.from(map.values()).map((item) => {
      const { pct, label, isWithoutForecast } = formatPercentValue(item.pesanan, item.forecast);
      const gap = item.forecast - item.pesanan;

      return {
        ...item,
        pct: pct ?? -1,
        pct_label: label,
        isWithoutForecast,
        gap,
      };
    });
  }, [facts, isNetto]);

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
        else if (sortField === 'pesanan') cmp = a.pesanan - b.pesanan;
        else if (sortField === 'pct') cmp = a.pct - b.pct;
        else if (sortField === 'gap') cmp = a.gap - b.gap;

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
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 inline ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 inline ml-1" />
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
        {
          header: `Realisasi Pesanan ${isNetto ? 'Netto' : 'Bruto'} (Rp)`,
          key: 'pesanan',
          format: (r) => r.pesanan,
        },
        { header: '% Capaian', key: 'pct', format: (r) => r.pct_label },
        { header: 'Gap / Selisih (Rp)', key: 'gap', format: (r) => r.gap },
      ],
      `Kinerja_Cabang_BO_Q4_2026_${metric}`,
      'Kinerja BO'
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode BO, nama cabang, atau AM..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
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
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <span className="text-xs text-slate-500">
            Total: <strong className="text-slate-800">{filteredAndSorted.length}</strong> Cabang
          </span>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
              <tr>
                <th
                  onClick={() => handleSort('bo_code')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-24"
                >
                  Kode BO {renderSortIcon('bo_code')}
                </th>
                <th
                  onClick={() => handleSort('bo_name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Nama Cabang (BO) {renderSortIcon('bo_name')}
                </th>
                <th
                  onClick={() => handleSort('am_code')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-28"
                >
                  Area (AM) {renderSortIcon('am_code')}
                </th>
                <th
                  onClick={() => handleSort('forecast')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Target Forecast PO {renderSortIcon('forecast')}
                </th>
                <th
                  onClick={() => handleSort('pesanan')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Pesanan ({isNetto ? 'Netto' : 'Bruto'}) {renderSortIcon('pesanan')}
                </th>
                <th
                  onClick={() => handleSort('pct')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors min-w-[170px]"
                >
                  % Capaian {renderSortIcon('pct')}
                </th>
                <th
                  onClick={() => handleSort('gap')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Gap / Selisih {renderSortIcon('gap')}
                </th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((row) => {
                const style = getAchievementStyle(row.pct >= 0 ? row.pct : null, row.isWithoutForecast);
                const progressWidth = row.pct >= 0 ? Math.min(Math.max(row.pct, 0), 100) : 0;

                return (
                  <tr
                    key={row.bo_code}
                    onClick={() => onOpenBoDrawer(row.bo_code)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 px-2 py-0.5 rounded transition-colors">
                        {row.bo_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        <span>{row.bo_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {row.am_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800 tabular-nums">
                      {formatThousand(row.forecast, true)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-700 tabular-nums">
                      {formatThousand(row.pesanan, true)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}>
                            {row.pct_label}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${style.progressBarColor}`}
                            style={{ width: `${progressWidth}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-700 tabular-nums">
                      {formatThousand(row.gap, true)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBoDrawer(row.bo_code);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 group-hover:underline"
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
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data Cabang yang sesuai dengan pencarian atau filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredAndSorted.length} Total Data)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2 font-medium">
                {currentPage} / {totalPages}
              </div>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
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
