import { one, query } from './db.js';
import { addMonths, monthStart, todayISO } from './dates.js';

export const shapeExpense = (r) => ({
  id: r.id,
  name: r.name,
  amount: Number(r.amount),
  currency: r.currency,
  dueDay: r.due_day === null ? null : Number(r.due_day),
  category: r.category,
  isRecurring: r.is_recurring,
  frequency: r.frequency ?? 'monthly',
  monthlyPhp: monthlyEquivalent(Number(r.amount), r.frequency ?? 'monthly'),
  startDate: r.start_date ? r.start_date.toISOString().slice(0, 10) : null,
  endDate: r.end_date ? r.end_date.toISOString().slice(0, 10) : null,
  notes: r.notes,
  sortOrder: r.sort_order,
  archivedAt: r.archived_at,
  accountId: r.account_id ?? null,
});

export const shapePayment = (r) => ({
  id: r.id,
  expenseId: r.expense_id,
  period: r.period.toISOString().slice(0, 10),
  dueDate: r.due_date.toISOString().slice(0, 10),
  amount: Number(r.amount),
  paidOn: r.paid_on ? r.paid_on.toISOString().slice(0, 10) : null,
  paidAmount: r.paid_amount === null ? null : Number(r.paid_amount),
  notes: r.notes,
  // Definition fields, so editing a bill edits the expense behind it and not
  // the materialised monthly figure.
  frequency: r.frequency ?? 'monthly',
  baseAmount: r.base_amount === undefined || r.base_amount === null ? undefined : Number(r.base_amount),
  isRecurring: r.is_recurring === undefined ? undefined : r.is_recurring,
  endDate: r.end_date ? r.end_date.toISOString().slice(0, 10) : null,
});

/**
 * How many times a year each cadence happens. `amount` on an expense is the
 * cost of ONE occurrence, so a fortnightly bill is not the same size as a
 * monthly one and must never be added up as if it were.
 */
export const PER_YEAR = { weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, yearly: 1 };

/**
 * The monthly equivalent of one occurrence. Weekly and fortnightly costs are
 * averaged over the year, because 4 payments some months and 5 in others is
 * noise she cannot plan around. Quarterly and yearly costs are NOT averaged:
 * they land whole, in the month they land, which is the thing that actually
 * empties the account.
 */
export function monthlyEquivalent(amount, frequency = 'monthly') {
  const n = Number(amount) || 0;
  if (frequency === 'weekly') return Math.round((n * 52 / 12) * 100) / 100;
  if (frequency === 'biweekly') return Math.round((n * 26 / 12) * 100) / 100;
  return Math.round(n * 100) / 100;
}

/**
 * Creates the month's instances for every expense that applies, without ever
 * touching one that already exists. Editing an expense's amount therefore
 * never rewrites a month Karen has already reconciled.
 *
 * A "spread" expense (no due day) still gets an instance, dated to the first
 * of the month, so it shows up in totals; the UI renders it as spread rather
 * than as a bill landing on the 1st.
 */
export async function ensurePeriod(monthIso) {
  const period = monthStart(monthIso);

  // One statement, for two reasons. It is atomic, so an expense deleted
  // between a SELECT and its INSERT can no longer blow up the home screen
  // with a foreign key violation. And it is one round trip instead of one per
  // expense per month, which was ~100 round trips just to open the app.
  await query(
    `insert into expense_payments (expense_id, period, due_date, amount)
     select e.id,
            $1::date,
            case when e.due_day is null then $1::date
                 else make_date(
                        extract(year  from $1::date)::int,
                        extract(month from $1::date)::int,
                        least(e.due_day::int,
                              extract(day from ($1::date + interval '1 month - 1 day'))::int))
            end as due_date,
            case e.frequency
              when 'weekly'   then round(e.amount * 52 / 12.0, 2)
              when 'biweekly' then round(e.amount * 26 / 12.0, 2)
              else e.amount
            end
       from expenses e
      where e.archived_at is null
        and e.start_date < ($1::date + interval '1 month')
        and (e.end_date is null or e.end_date >= $1::date)
        -- A one-off exists only in the month it was set for.
        and (e.is_recurring or date_trunc('month', e.start_date) = $1::date)
        -- Quarterly and yearly costs exist only in the months they land in,
        -- counted from the month they started.
        and (e.frequency not in ('quarterly', 'yearly')
             or mod(
                  (extract(year from $1::date)::int * 12 + extract(month from $1::date)::int)
                  - (extract(year from e.start_date)::int * 12 + extract(month from e.start_date)::int),
                  case e.frequency when 'quarterly' then 3 else 12 end) = 0)
        -- Respect the last instalment even when the day clamps to month end.
        and (e.end_date is null or
             (case when e.due_day is null then $1::date
                   else make_date(extract(year from $1::date)::int,
                                  extract(month from $1::date)::int,
                                  least(e.due_day::int,
                                        extract(day from ($1::date + interval '1 month - 1 day'))::int))
              end) <= e.end_date)
        -- Added mid-month with a day that has already gone by: it still belongs
        -- to this month. She is adding a cost she already has, and leaving it
        -- out silently understates the month. It is NOT flagged overdue, which
        -- is handled where bills are shaped: a bill cannot be late when it
        -- predates the day she started tracking it.
     on conflict (expense_id, period) do nothing`,
    [period],
  );

  return period;
}

/**
 * Deletes payment rows that no longer belong: an expense given an end date, or
 * archived, after its future months were already materialised.
 *
 * Only UNPAID rows. A paid row is history and reconciled; deleting it would
 * quietly rewrite what she recorded actually happening.
 */
export async function prunePeriods() {
  const { rowCount } = await query(
    `delete from expense_payments p
      using expenses e
      where e.id = p.expense_id
        and p.paid_on is null
        and (
             e.archived_at is not null
          or e.start_date >= (p.period + interval '1 month')
          or (e.end_date is not null and e.end_date < p.period)
          or (e.end_date is not null and p.due_date > e.end_date)
          or (not e.is_recurring and date_trunc('month', e.start_date) <> p.period)
        )`,
  );
  return rowCount;
}

/** Ensures a window of months around today so calendars and trends are filled. */
export async function ensureWindow(centerMonthIso, back = 3, forward = 2) {
  const center = monthStart(centerMonthIso || todayISO());
  for (let i = -back; i <= forward; i += 1) {
    await ensurePeriod(addMonths(center, i));
  }
  await prunePeriods();
  return center;
}

export async function getSetting(key, fallback) {
  const row = await one('select value from settings where key = $1', [key]);
  return row ? row.value : fallback;
}

export async function putSetting(key, value) {
  const row = await one(
    `insert into settings (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()
     returning value`,
    [key, JSON.stringify(value)],
  );
  return row.value;
}
