const php = new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', maximumFractionDigits: 0,
});
const phpExact = new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const usd = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 2,
});

export const peso = (n, exact = false) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return (exact ? phpExact : php).format(Number(n));
};

export const dollar = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return usd.format(Number(n));
};

export const money = (n, currency, exact) => (currency === 'USD' ? dollar(n) : peso(n, exact));

/**
 * Dates arrive as 'YYYY-MM-DD'. `new Date(iso)` is UTC midnight, which renders
 * as the previous day in Manila, so they are split by hand instead.
 */
export function fmtDate(iso, opts = { month: 'short', day: 'numeric' }) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '—';
  return new Intl.DateTimeFormat('en-PH', { ...opts, timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d)));
}

export const fmtLongDate = (iso) => fmtDate(iso, { month: 'long', day: 'numeric', year: 'numeric' });
export const fmtDayName = (iso) => fmtDate(iso, { weekday: 'short' });
export const fmtMonth = (ym) => fmtDate(`${ym}-01`, { month: 'long', year: 'numeric' });
export const fmtMonthShort = (ym) => fmtDate(`${ym}-01`, { month: 'short' });

export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

export function relativeDay(iso, todayIso) {
  if (!iso || !todayIso) return '';
  const days = Math.round(
    (Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${todayIso}T00:00:00Z`)) / 86400000,
  );
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export const pct = (n) => `${Math.round(Number(n) || 0)}%`;
