import React from 'react';
import { ChevronRight, Filter, RotateCcw, Building, MapPin, Briefcase, Calendar } from 'lucide-react';
import { FilterState, MetaResponse, User } from '../types';

interface FilterBarProps {
  user: User;
  meta: MetaResponse | null;
  filter: FilterState;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  user,
  meta,
  filter,
  onFilterChange,
  onResetFilters,
}) => {
  // If user is AM, restrict AM code
  const isDirektur = user.role === 'direktur';

  // Available BOs filtered by active AM
  const availableBos = React.useMemo(() => {
    if (!meta?.bos) return [];
    if (filter.am_code) {
      return meta.bos.filter((b) => b.am_code === filter.am_code);
    }
    return meta.bos;
  }, [meta?.bos, filter.am_code]);

  // Active filter count
  const activeFiltersCount =
    (filter.bulan_no ? 1 : 0) +
    (isDirektur && filter.am_code ? 1 : 0) +
    (filter.bo_code ? 1 : 0) +
    (filter.principal ? 1 : 0);

  // Selected names for breadcrumbs
  const selectedAmName = React.useMemo(() => {
    if (!filter.am_code || !meta?.ams) return null;
    const found = meta.ams.find((a) => a.code === filter.am_code);
    return found ? `${found.code} (${found.name.split('(')[1]?.replace(')', '') || found.name})` : filter.am_code;
  }, [filter.am_code, meta?.ams]);

  const selectedBoName = React.useMemo(() => {
    if (!filter.bo_code || !meta?.bos) return null;
    const found = meta.bos.find((b) => b.code === filter.bo_code);
    return found ? `${found.code} - ${found.name}` : filter.bo_code;
  }, [filter.bo_code, meta?.bos]);

  const selectedMonthName = React.useMemo(() => {
    if (!filter.bulan_no) return 'Semua Q4';
    if (filter.bulan_no === 10) return 'Oktober';
    if (filter.bulan_no === 11) return 'November';
    if (filter.bulan_no === 12) return 'Desember';
    return `Bulan ${filter.bulan_no}`;
  }, [filter.bulan_no]);

  return (
    <div className="bg-white/95 backdrop-blur-xs border-b border-slate-200 sticky top-[73px] z-30 shadow-xs px-4 sm:px-6 py-2.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Breadcrumb row */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap py-0.5">
          <span className="flex items-center gap-1 text-slate-700 font-semibold">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter Aktif:</span>
          </span>

          <button
            onClick={() => onFilterChange({ am_code: null, bo_code: null })}
            className={`hover:text-indigo-600 font-medium cursor-pointer transition-colors ${
              !filter.am_code ? 'text-indigo-600 font-bold' : ''
            }`}
          >
            {isDirektur ? 'Nasional' : `Wilayah ${user.am_code}`}
          </button>

          {isDirektur && filter.am_code && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <button
                onClick={() => onFilterChange({ bo_code: null })}
                className={`hover:text-indigo-600 font-medium cursor-pointer transition-colors ${
                  !filter.bo_code ? 'text-indigo-600 font-bold' : ''
                }`}
              >
                {selectedAmName}
              </button>
            </>
          )}

          {filter.bo_code && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-indigo-600 font-bold">{selectedBoName}</span>
            </>
          )}

          {filter.principal && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                Principal: {filter.principal}
              </span>
            </>
          )}

          {filter.bulan_no && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                {selectedMonthName}
              </span>
            </>
          )}
        </div>

        {/* Filter Dropdowns row */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Bulan Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filter.bulan_no || ''}
              onChange={(e) =>
                onFilterChange({
                  bulan_no: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer pr-1"
            >
              <option value="">Semua Q4 (Okt-Des)</option>
              <option value="10">Oktober 2026</option>
              <option value="11">November 2026</option>
              <option value="12">Desember 2026</option>
            </select>
          </div>

          {/* AM Selector (Only for Direktur) */}
          {isDirektur && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 max-w-[190px]">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filter.am_code || ''}
                onChange={(e) => {
                  const val = e.target.value || null;
                  onFilterChange({
                    am_code: val,
                    bo_code: null, // Reset BO when AM changes
                  });
                }}
                className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer truncate w-full"
              >
                <option value="">Semua AM (Nasional)</option>
                {meta?.ams.map((am) => (
                  <option key={am.code} value={am.code}>
                    {am.code} - {am.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BO / Cabang Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 max-w-[190px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filter.bo_code || ''}
              onChange={(e) =>
                onFilterChange({
                  bo_code: e.target.value || null,
                })
              }
              className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer truncate w-full"
            >
              <option value="">Semua Cabang (BO)</option>
              {availableBos.map((bo) => (
                <option key={bo.code} value={bo.code}>
                  {bo.code} - {bo.name}
                </option>
              ))}
            </select>
          </div>

          {/* Principal Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filter.principal || ''}
              onChange={(e) =>
                onFilterChange({
                  principal: e.target.value || null,
                })
              }
              className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="">Semua Principal</option>
              {meta?.principals.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 cursor-pointer"
              title="Reset Semua Filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
