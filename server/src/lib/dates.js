/**
 * Every date in this app is a calendar date, never an instant. Parsing
 * 'YYYY-MM-DD' with `new Date()` gives UTC midnight, which renders as the
 * previous day anywhere west of Greenwich and quietly shifts due dates. So all
 * arithmetic here runs on UTC-noon Date objects and everything crossing a
 * boundary is a plain string.
 */

const DAY = 86_400_000;

export function parseISO(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? '').slice(0, 10));
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISO(date) {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

/** Today in a fixed IANA zone, as a calendar date. Defaults to Manila. */
export function todayISO(timeZone = 'Asia/Manila', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  return parts;
}

export const addDays = (iso, n) => {
  const d = parseISO(iso);
  return d ? toISO(new Date(d.getTime() + n * DAY)) : null;
};

export const diffDays = (a, b) => {
  const da = parseISO(a); const db = parseISO(b);
  if (!da || !db) return null;
  return Math.round((db.getTime() - da.getTime()) / DAY);
};

export const daysInMonth = (year, month1) => new Date(Date.UTC(year, month1, 0)).getUTCDate();

export const monthStart = (iso) => `${String(iso).slice(0, 7)}-01`;

export const addMonths = (monthIso, n) => {
  const d = parseISO(monthStart(monthIso));
  if (!d) return null;
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + n;
  const y = Math.floor(total / 12);
  const m = total % 12;
  return `${y}-${String(m + 1).padStart(2, '0')}-01`;
};

/**
 * The 31st of February does not exist. A bill due on the 31st lands on the
 * last day of any shorter month rather than rolling into the next one, which
 * is how every bank in the country actually behaves.
 */
export function dueDateFor(monthIso, dueDay) {
  const d = parseISO(monthStart(monthIso));
  if (!d || !dueDay) return null;
  const year = d.getUTCFullYear();
  const month1 = d.getUTCMonth() + 1;
  const day = Math.min(Number(dueDay), daysInMonth(year, month1));
  return `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export const clampMonth = (iso) => `${String(iso).slice(0, 7)}`;
