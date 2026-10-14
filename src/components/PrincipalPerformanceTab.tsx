import React, { useState, useMemo } from 'react';
import {
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Briefcase,
  PieChart,
} from 'lucide-react';
import { FactRecord, MetricType } from '../types';
import {
  formatThousand,
  formatPercentValue,
  getAchievementStyle,
} from '../utils/formatters';
import { exportToExcel } from '../services/export';

interface PrincipalPerformanceTabProps {
  facts: FactRecord[];
  metric: MetricType;
}

type SortField = 'principal' | 'forecast' | 'pesanan' | 'pct' | 'gap' | 'share' | 'qty';

export const PrincipalPerformanceTab: React.FC<PrincipalPerformanceTabProps> = ({
  facts,
  metric,
}) => {
  const isNetto = metric === 'netto';
  const [sortField, setSortField] = useState<SortField>('pesanan');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Total sales for calculating share percentage
  const totalPesananAll = useMemo(() => {
    return facts.reduce((acc, f) => acc + (isNetto ? f.pesanan_netto : f.pesanan_bruto), 0);
  }, [facts, isNetto]);

  // Aggregate by Principal
  const principalData = useMemo(() => {
    const map = new Map<
      string,
      {
        principal: string;
        forecast: number;
        pesanan: number;
        qty: number;
      }
    >();

    facts.forEach((f) => {
      const current = map.get(f.principal) || {
        principal: f.principal,
        forecast: 0,
        pesanan: 0,
        qty: 0,
      };
      const val = isNetto ? f.pesanan_netto : f.pesanan_bruto;
      map.set(f.principal, {
        principal: f.principal,
        forecast: current.forecast + f.forecast,
        pesanan: current.pesanan + val,
        qty: current.qty + (f.pesanan_qty || 0),
      });
    });

    return Array.from(map.values()).map((item) => {
      const { pct, label, isWithoutForecast } = formatPercentValue(item.pesanan, item.forecast);
      const gap = item.forecast - item.pesanan;
      const share = totalPesananAll > 0 ? (item.pesanan / totalPesananAll) * 100 : 0;

      return {
        ...item,
        pct: pct ?? -1,
        pct_label: label,
        isWithoutForecast,
        gap,
        share,
      };
    });
  }, [facts, isNetto, totalPesananAll]);

  // Sort
  const sortedData = useMemo(() => {
    return [...principalData].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'principal') cmp = a.principal.localeCompare(b.principal);
      else if (sortField === 'forecast') cmp = a.forecast - b.forecast;
      else if (sortField === 'pesanan') cmp = a.pesanan - b.pesanan;
      else if (sortField === 'pct') cmp = a.pct - b.pct;
      else if (sortField === 'gap') cmp = a.gap - b.gap;
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
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 inline ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 inline ml-1" />
    );
  };

  const handleExport = () => {
    exportToExcel(
      sortedData,
      [
        { header: 'Kode Principal', key: 'principal' },
        { header: 'Target Forecast PO (Rp)', key: 'forecast', format: (r) => r.forecast },
        {
          header: `Realisasi Pesanan ${isNetto ? 'Netto' : 'Bruto'} (Rp)`,
          key: 'pesanan',
          format: (r) => r.pesanan,
        },
        { header: '% Capaian', key: 'pct', format: (r) => r.pct_label },
        { header: 'Gap / Selisih (Rp)', key: 'gap', format: (r) => r.gap },
        {
          header: '% Kontribusi Penjualan',
          key: 'share',
          format: (r) => `${r.share.toFixed(2)}%`,
        },
        { header: 'Total Qty Pesanan', key: 'qty', format: (r) => r.qty },
      ],
      `Kinerja_Principal_Q4_2026_${metric}`,
      'Kinerja Principal'
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header Row with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            Matriks Komparasi Realisasi &amp; Target Seluruh Principal
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {sortedData.length} Principal Aktif
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
                  onClick={() => handleSort('principal')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-32"
                >
                  Principal {renderSortIcon('principal')}
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
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors min-w-[180px]"
                >
                  % Capaian {renderSortIcon('pct')}
                </th>
                <th
                  onClick={() => handleSort('gap')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Gap / Selisih {renderSortIcon('gap')}
                </th>
                <th
                  onClick={() => handleSort('share')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors w-36"
                >
                  Kontribusi Penjualan {renderSortIcon('share')}
                </th>
                <th
                  onClick={() => handleSort('qty')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors w-28"
                >
                  Volume (Qty) {renderSortIcon('qty')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedData.map((row) => {
                const style = getAchievementStyle(row.pct >= 0 ? row.pct : null, row.isWithoutForecast);
                const progressWidth = row.pct >= 0 ? Math.min(Math.max(row.pct, 0), 100) : 0;

                return (
                  <tr key={row.principal} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        <span className="font-mono text-sm">{row.principal}</span>
                      </div>
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
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-bold text-slate-800 tabular-nums">
                          {row.share.toFixed(2)}%
                        </span>
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.min(row.share * 2.5, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 tabular-nums font-medium">
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
