import React from 'react';
import { X, Info, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { ExcludedSku } from '../types';
import { formatRupiahShort, formatThousand } from '../utils/formatters';

interface SkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  skus: ExcludedSku[];
  excludedBruto: number;
  excludedNetto: number;
}

export const SkuModal: React.FC<SkuModalProps> = ({
  isOpen,
  onClose,
  skus,
  excludedBruto,
  excludedNetto,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sku-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 id="sku-modal-title" className="text-base font-bold text-slate-900">
                Transparansi SKU Dikecualikan
              </h3>
              <p className="text-xs text-slate-500">
                Rincian {skus.length} SKU Dikecualikan dari Target Komersial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600">
          <div className="bg-sky-50/60 border border-sky-100 rounded-lg p-3.5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sky-900 text-xs uppercase tracking-wide">
                Dasar Penyesuaian KPI Q4 2026
              </p>
              <p className="text-xs text-sky-800 mt-1 leading-relaxed">
                Sesuai kebijakan direksi, {skus.length} SKU proyek khusus ini <strong>dikecualikan dari perhitungan realisasi target komersial reguler</strong> agar evaluasi pencapaian tim penjualan murni mencerminkan serapan pasar bebas.
              </p>
            </div>
          </div>

          {/* Excluded Values Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-xs text-slate-500 font-medium block">Total Nilai Excluded (Netto)</span>
              <span className="text-lg font-bold text-slate-900 block mt-0.5">
                {formatRupiahShort(excludedNetto)}
              </span>
              <span className="text-[11px] text-slate-500 tabular-nums">
                Rp {formatThousand(excludedNetto)}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-xs text-slate-500 font-medium block">Total Nilai Excluded (Bruto)</span>
              <span className="text-lg font-bold text-slate-900 block mt-0.5">
                {formatRupiahShort(excludedBruto)}
              </span>
              <span className="text-[11px] text-slate-500 tabular-nums">
                Rp {formatThousand(excludedBruto)}
              </span>
            </div>
          </div>

          {/* List of SKUs */}
          <div>
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Daftar SKU Dikecualikan ({skus.length} Item):
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {skus.map((sku) => (
                <div key={sku.code} className="p-3 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {sku.code}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Excluded by Rule
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 text-xs">{sku.name}</p>
                  {sku.note && <p className="text-[11px] text-slate-500 mt-0.5">{sku.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
