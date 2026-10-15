export type UserRole = 'direktur' | 'am';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  am_code?: string;
}

export interface ExcludedSku {
  code: string;
  name: string;
  category?: string;
  note?: string;
}

export interface AmItem {
  code: string;
  name: string;
}

export interface BoItem {
  code: string;
  name: string;
  am_code: string;
}

export interface MetaResponse {
  year: number;
  last_sync_pesanan: string;
  last_sync_forecast: string;
  excluded_skus: ExcludedSku[];
  ams: AmItem[];
  bos: BoItem[];
  principals: string[];
}

export interface FactRecord {
  bulan_no: number; // 10, 11, 12
  am_code: string;
  am_name: string;
  bo_code: string;
  bo_name: string;
  principal: string;
  forecast: number;
  pesanan_bruto: number;
  pesanan_netto: number;
  pesanan_qty: number;
}

export interface PerBulanSummary {
  bulan_no: number;
  bulan_name: string;
  forecast: number;
  pesanan_netto: number;
  pesanan_bruto: number;
  pct_netto: number;
  pct_bruto: number;
  gap_netto: number;
  gap_bruto: number;
}

export interface SummaryResponse {
  forecast: number;
  pesanan_bruto: number;
  pesanan_netto: number;
  pct_bruto: number;
  pct_netto: number;
  gap_bruto: number;
  gap_netto: number;
  excluded_bruto: number;
  excluded_netto: number;
  per_bulan: PerBulanSummary[];
}

export type MetricType = 'netto' | 'bruto';

export interface FilterState {
  bulan_no: number | null; // null = Q4 (10, 11, 12)
  am_code: string | null;
  bo_code: string | null;
  principal: string | null;
  metric?: MetricType;
}

export type TabKey = 'executive' | 'am' | 'bo' | 'principal' | 'rankings';
