/**
 * Formatting utilities for Indonesian currency, numbers, and KPI metrics
 */

export function formatRupiahShort(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'Rp 0';

  const isNegative = value < 0;
  const absVal = Math.abs(value);

  let formatted = '';
  if (absVal >= 1_000_000_000_000) {
    // Triliun
    formatted = `${(absVal / 1_000_000_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} T`;
  } else if (absVal >= 1_000_000_000) {
    // Miliar
    formatted = `${(absVal / 1_000_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} M`;
  } else if (absVal >= 1_000_000) {
    // Juta
    formatted = `${(absVal / 1_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} jt`;
  } else if (absVal >= 1_000) {
    // Ribu
    formatted = `${(absVal / 1_000).toLocaleString('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} rb`;
  } else {
    formatted = absVal.toLocaleString('id-ID');
  }

  return `${isNegative ? '-' : ''}Rp ${formatted}`;
}

export function formatThousand(value: number | null | undefined, prefixRp = false): string {
  if (value === null || value === undefined || isNaN(value)) return prefixRp ? 'Rp 0' : '0';

  const isNegative = value < 0;
  const rounded = Math.round(Math.abs(value));
  const formatted = rounded.toLocaleString('id-ID');

  if (prefixRp) {
    return `${isNegative ? '-' : ''}Rp ${formatted}`;
  }
  return `${isNegative ? '-' : ''}${formatted}`;
}

export function formatPercentValue(
  pesanan: number,
  forecast: number
): { pct: number | null; label: string; isWithoutForecast: boolean } {
  if (forecast <= 0) {
    if (pesanan > 0) {
      return { pct: null, label: 'N/A (Tanpa Forecast)', isWithoutForecast: true };
    }
    return { pct: 0, label: '0,00%', isWithoutForecast: false };
  }

  const pct = (pesanan / forecast) * 100;
  return {
    pct,
    label: `${pct.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
    isWithoutForecast: false,
  };
}

export interface AchievementBadgeStyle {
  bg: string;
  text: string;
  border: string;
  progressBarColor: string;
  label: string;
}

export function getAchievementStyle(pct: number | null, isWithoutForecast: boolean): AchievementBadgeStyle {
  if (isWithoutForecast) {
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      progressBarColor: 'bg-slate-400',
      label: 'Tanpa Target',
    };
  }

  if (pct === null || isNaN(pct)) {
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      progressBarColor: 'bg-slate-300',
      label: '0%',
    };
  }

  if (pct < 50) {
    return {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      progressBarColor: 'bg-red-500',
      label: 'Kritis (<50%)',
    };
  }
  if (pct < 80) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      progressBarColor: 'bg-amber-500',
      label: 'Perlu Perhatian (50-80%)',
    };
  }
  if (pct < 100) {
    return {
      bg: 'bg-lime-50',
      text: 'text-lime-700',
      border: 'border-lime-200',
      progressBarColor: 'bg-lime-500',
      label: 'Mendekati (80-100%)',
    };
  }
  return {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    progressBarColor: 'bg-emerald-500',
    label: 'Tercapai (≥100%)',
  };
}

/**
 * Run-rate calculation for October 2026 (day 14 of 31)
 */
export function calculateRunRate(
  pesananOktober: number,
  forecastOktober: number,
  currentDay = 14,
  totalDaysInMonth = 31
) {
  const safeCurrentDay = Math.max(1, currentDay);
  const avgPerDay = pesananOktober / safeCurrentDay;
  const projectedMonthEnd = avgPerDay * totalDaysInMonth;
  const remainingDays = Math.max(1, totalDaysInMonth - safeCurrentDay);
  const remainingTarget = Math.max(0, forecastOktober - pesananOktober);
  const requiredPerDay = remainingTarget / remainingDays;

  return {
    currentDay: safeCurrentDay,
    totalDays: totalDaysInMonth,
    remainingDays,
    avgPerDay,
    projectedMonthEnd,
    projectedPct: forecastOktober > 0 ? (projectedMonthEnd / forecastOktober) * 100 : 0,
    remainingTarget,
    requiredPerDay,
  };
}

export function formatSyncDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const cleanStr = dateStr.replace(' ', 'T');
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${mins}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

