import { addDays, addMonths, compare, daysInMonth, diffDays, monthStart, parseISO, toISO } from './dates.js';

export const FREQUENCIES = ['weekly', 'biweekly', 'semimonthly', 'monthly'];

/** Pay periods per year. Used for the "per paycheck" share of spread costs. */
export const PERIODS_PER_YEAR = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

const STEP_DAYS = { weekly: 7, biweekly: 14 };

/**
 * The payday on or immediately before `iso`, walking from the anchor. Anchors
 * can sit in the future (Karen's first Wise payment is 2026-08-28), so this
 * has to walk backwards as happily as forwards.
 */
function alignedPayday(anchorIso, iso, frequency) {
  if (frequency === 'weekly' || frequency === 'biweekly') {
    const step = STEP_DAYS[frequency];
    const delta = diffDays(anchorIso, iso);
    if (delta === null) return null;
    return addDays(anchorIso, Math.floor(delta / step) * step);
  }

  if (frequency === 'monthly') {
    const anchor = parseISO(anchorIso);
    const target = parseISO(iso);
    if (!anchor || !target) return null;
    const day = anchor.getUTCDate();
    const candidate = (monthIso) => {
      const m = parseISO(monthStart(monthIso));
      const dim = daysInMonth(m.getUTCFullYear(), m.getUTCMonth() + 1);
      return `${monthStart(monthIso).slice(0, 8)}${String(Math.min(day, dim)).padStart(2, '0')}`;
    };
    const thisMonth = candidate(toISO(target));
    return compare(thisMonth, iso) <= 0 ? thisMonth : candidate(addMonths(toISO(target), -1));
  }

  // semimonthly: the 15th and the last day of the month
  const target = parseISO(iso);
  if (!target) return null;
  const y = target.getUTCFullYear();
  const m1 = target.getUTCMonth() + 1;
  const pad = (n) => String(n).padStart(2, '0');
  const fifteenth = `${y}-${pad(m1)}-15`;
  const eom = `${y}-${pad(m1)}-${pad(daysInMonth(y, m1))}`;
  if (compare(iso, eom) >= 0) return eom;
  if (compare(iso, fifteenth) >= 0) return fifteenth;
  const prev = addMonths(`${y}-${pad(m1)}-01`, -1);
  const pd = parseISO(prev);
  return `${pd.getUTCFullYear()}-${pad(pd.getUTCMonth() + 1)}-${pad(daysInMonth(pd.getUTCFullYear(), pd.getUTCMonth() + 1))}`;
}

export function nextPayday(anchorIso, afterIso, frequency) {
  const current = alignedPayday(anchorIso, afterIso, frequency);
  if (!current) return null;
  if (frequency === 'weekly' || frequency === 'biweekly') {
    return addDays(current, STEP_DAYS[frequency]);
  }
  // Ask for the aligned payday of the day after this one, repeatedly, until it moves.
  let probe = addDays(current, 1);
  for (let i = 0; i < 40; i += 1) {
    const aligned = alignedPayday(anchorIso, probe, frequency);
    if (aligned && compare(aligned, current) > 0) return aligned;
    probe = addDays(probe, 1);
  }
  return null;
}

/**
 * `count` consecutive paychecks starting with the one covering `fromIso`.
 * A paycheck landing on P is treated as funding everything due in [P, next P),
 * which is the only framing that answers "can I pay this bill out of this
 * cheque".
 */
export function paycheckSchedule({ anchorIso, frequency, fromIso, count = 4 }) {
  if (!FREQUENCIES.includes(frequency)) return [];
  const out = [];
  let payDate = alignedPayday(anchorIso, fromIso, frequency);
  if (!payDate) return [];

  for (let i = 0; i < count; i += 1) {
    const next = nextPayday(anchorIso, payDate, frequency);
    out.push({ payDate, coversFrom: payDate, coversTo: next, index: i });
    payDate = next;
    if (!payDate) break;
  }
  return out;
}

/** Monthly cost of an amount charged at `frequency`. */
export const monthlyFromPeriodic = (amount, frequency) =>
  (Number(amount) || 0) * (PERIODS_PER_YEAR[frequency] || 12) / 12;
