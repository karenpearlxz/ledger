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
  startDate: r.start_date ? r.start_date.toISOString().slice(0, 10) : null,
  endDate: r.end_date ? r.end_date.toISOString().slice(0, 10) : null,
  notes: r.notes,
  sortOrder: r.sort_order,
  archivedAt: r.archived_at,
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
});

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
            e.amount
       from expenses e
      where e.archived_at is null
        and e.start_date < ($1::date + interval '1 month')
        and (e.end_date is null or e.end_date >= $1::date)
        -- A one-off exists only in the month it was set for.
        and (e.is_recurring or date_trunc('month', e.start_date) = $1::date)
        -- Respect the last instalment even when the day clamps to month end.
        and (e.end_date is null or
             (case when e.due_day is null then $1::date
                   else make_date(extract(year from $1::date)::int,
                                  extract(month from $1::date)::int,
                                  least(e.due_day::int,
                                        extract(day from ($1::date + interval '1 month - 1 day'))::int))
              end) <= e.end_date)
        -- Added mid-month with a day that has already gone: do not backdate it
        -- into a month where it would read as instantly overdue.
        and not (e.due_day is not null
                 and date_trunc('month', e.start_date) = $1::date
                 and make_date(extract(year from $1::date)::int,
                               extract(month from $1::date)::int,
                               least(e.due_day::int,
                                     extract(day from ($1::date + interval '1 month - 1 day'))::int))
                     < e.start_date)
     on conflict (expense_id, period) do nothing`,
    [period],
  );

  return period;
}

/** Ensures a window of months around today so calendars and trends are filled. */
export async function ensureWindow(centerMonthIso, back = 3, forward = 2) {
  const center = monthStart(centerMonthIso || todayISO());
  for (let i = -back; i <= forward; i += 1) {
    await ensurePeriod(addMonths(center, i));
  }
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
