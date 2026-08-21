import express from 'express';
import { z } from 'zod';

import { many, one, query } from '../lib/db.js';
import { addMonths, compare, dueDateFor, monthStart, todayISO } from '../lib/dates.js';
import { ensurePeriod, ensureWindow, monthlyEquivalent, shapeExpense, shapePayment } from '../lib/finance.js';
import { badRequest, route } from '../lib/http.js';

export const expensesRouter = express.Router();

const MONTH = /^\d{4}-\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const money = z.coerce.number().min(0).max(99_999_999).finite();

/** Weekly and fortnightly costs have no one day of the month, so they spread. */
const spreadOnly = (f) => f === 'weekly' || f === 'biweekly';

const expenseBody = z.object({
  name: z.string().trim().min(1).max(80),
  amount: money,
  currency: z.enum(['PHP', 'USD']).default('PHP'),
  dueDay: z.coerce.number().int().min(1).max(31).nullable().optional(),
  category: z.string().trim().min(1).max(40).default('Other'),
  isRecurring: z.boolean().default(true),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  startDate: z.string().regex(DATE).optional(),
  endDate: z.string().regex(DATE).nullable().optional(),
  notes: z.string().max(500).default(''),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  accountId: z.string().uuid().nullable().optional(),
});

expensesRouter.get('/', route(async (_req, res) => {
  const rows = await many(
    'select * from expenses where archived_at is null order by sort_order, lower(name)',
  );
  res.json({ expenses: rows.map(shapeExpense) });
}));

expensesRouter.post('/', route(async (req, res) => {
  const parsed = expenseBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;

  if (!b.isRecurring && !b.dueDay && !spreadOnly(b.frequency)) {
    return res.status(400).json({ error: 'a one-off needs a day it falls on' });
  }
  if (b.endDate && b.startDate && compare(b.endDate, b.startDate) < 0) {
    return res.status(400).json({ error: 'the end date is before the start date' });
  }

  const row = await one(
    `insert into expenses (name, amount, currency, due_day, category, is_recurring, start_date, end_date, notes, sort_order, frequency, account_id)
          values ($1,$2,$3,$4,$5,$6, coalesce($7::date, current_date), $8, $9, coalesce($10, 100), $11, $12)
       returning *`,
    [b.name, b.amount, b.currency, spreadOnly(b.frequency) ? null : (b.dueDay ?? null), b.category, b.isRecurring,
      b.startDate ?? null, b.endDate ?? null, b.notes, b.sortOrder ?? null, b.frequency, b.accountId ?? null],
  );

  await ensureWindow(todayISO());
  res.status(201).json({ expense: shapeExpense(row) });
}));

expensesRouter.patch('/:id', route(async (req, res) => {
  const parsed = expenseBody.partial().safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;

  const current = await one('select * from expenses where id = $1 and archived_at is null', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'no such expense' });

  const merged = {
    name: b.name ?? current.name,
    amount: b.amount ?? Number(current.amount),
    currency: b.currency ?? current.currency,
    dueDay: b.dueDay === undefined ? current.due_day : b.dueDay,
    category: b.category ?? current.category,
    isRecurring: b.isRecurring ?? current.is_recurring,
    frequency: b.frequency ?? current.frequency ?? 'monthly',
    startDate: b.startDate ?? current.start_date.toISOString().slice(0, 10),
    endDate: b.endDate === undefined
      ? (current.end_date ? current.end_date.toISOString().slice(0, 10) : null)
      : b.endDate,
    notes: b.notes ?? current.notes,
    sortOrder: b.sortOrder ?? current.sort_order,
    accountId: b.accountId === undefined ? current.account_id : b.accountId,
  };

  if (!merged.isRecurring && !merged.dueDay && !spreadOnly(merged.frequency)) {
    return res.status(400).json({ error: 'a one-off needs a day it falls on' });
  }
  if (merged.endDate && compare(merged.endDate, merged.startDate) < 0) {
    return res.status(400).json({ error: 'the end date is before the start date' });
  }

  const row = await one(
    `update expenses set name=$2, amount=$3, currency=$4, due_day=$5, category=$6,
            is_recurring=$7, start_date=$8, end_date=$9, notes=$10, sort_order=$11,
            frequency=$12, account_id=$13, updated_at=now()
      where id=$1 returning *`,
    [req.params.id, merged.name, merged.amount, merged.currency,
      spreadOnly(merged.frequency) ? null : merged.dueDay, merged.category,
      merged.isRecurring, merged.startDate, merged.endDate, merged.notes, merged.sortOrder,
      merged.frequency, merged.accountId ?? null],
  );

  // Unreconciled future instances follow the definition; anything already
  // marked paid is history and is left exactly as it was.
  const today = todayISO();
  // The instance carries the MONTHLY EQUIVALENT, never the raw occurrence.
  // Writing merged.amount straight through collapsed a fortnightly ₱2,250 back
  // to ₱2,250 for the month every time the expense was saved.
  const monthlyAmount = monthlyEquivalent(merged.amount, merged.frequency);
  await query(
    `update expense_payments
        set amount = $2,
            due_date = case when $3::smallint is null then period
                            else make_date(extract(year from period)::int, extract(month from period)::int,
                                 least($3::smallint, extract(day from (date_trunc('month', period) + interval '1 month - 1 day'))::int)) end,
            updated_at = now()
      where expense_id = $1 and paid_on is null and period >= date_trunc('month', $4::date)`,
    [req.params.id, monthlyAmount, spreadOnly(merged.frequency) ? null : merged.dueDay, today],
  );

  res.json({ expense: shapeExpense(row) });
}));

expensesRouter.delete('/:id', route(async (req, res) => {
  const hard = req.query.hard === '1';
  const row = await one('select id from expenses where id = $1', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'no such expense' });

  if (hard) {
    await query('delete from expenses where id = $1', [req.params.id]);
  } else {
    // Archiving keeps paid history intact and drops only the unpaid future.
    await query('update expenses set archived_at = now() where id = $1', [req.params.id]);
    await query(
      `delete from expense_payments
        where expense_id = $1 and paid_on is null and period >= date_trunc('month', current_date)`,
      [req.params.id],
    );
  }
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ payments
const paymentBody = z.object({
  amount: money.optional(),
  paidOn: z.string().regex(DATE).nullable().optional(),
  paidAmount: money.nullable().optional(),
  notes: z.string().max(500).optional(),
});

expensesRouter.get('/payments/:month', route(async (req, res) => {
  if (!MONTH.test(req.params.month)) return res.status(400).json({ error: 'month must look like 2026-08' });
  const period = await ensurePeriod(`${req.params.month}-01`);
  const rows = await many(
    `select p.*, e.name, e.category, e.currency, e.due_day
       from expense_payments p join expenses e on e.id = p.expense_id
      where p.period = $1 order by (e.due_day is null), e.due_day, lower(e.name)`,
    [period],
  );
  res.json({
    month: req.params.month,
    payments: rows.map((r) => ({
      ...shapePayment(r), name: r.name, category: r.category, currency: r.currency,
      spread: r.due_day === null,
    })),
  });
}));

expensesRouter.patch('/payments/:id', route(async (req, res) => {
  const parsed = paymentBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;

  const current = await one('select * from expense_payments where id = $1', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'no such bill' });

  const paidOn = b.paidOn === undefined
    ? (current.paid_on ? current.paid_on.toISOString().slice(0, 10) : null)
    : b.paidOn;
  const amount = b.amount ?? Number(current.amount);
  // Marking paid without saying how much means it was paid in full.
  let paidAmount = b.paidAmount === undefined
    ? (current.paid_amount === null ? null : Number(current.paid_amount))
    : b.paidAmount;
  if (paidOn && paidAmount === null) paidAmount = amount;
  if (!paidOn) paidAmount = null;

  const row = await one(
    `update expense_payments set amount=$2, paid_on=$3, paid_amount=$4, notes=$5, updated_at=now()
      where id=$1 returning *`,
    [req.params.id, amount, paidOn, paidAmount, b.notes ?? current.notes],
  );

  // If payment status changed, adjust account balance
  const wasPaid = current.paid_on !== null;
  const nowPaid = paidOn !== null;
  if (wasPaid !== nowPaid) {
    // Get the expense's account
    const expense = await one('select account_id from expenses where id = $1', [current.expense_id]);
    if (expense?.account_id) {
      // Get current balance for this account
      const latestBalance = await one(
        `select amount from balances where account_id = $1 order by as_of desc, created_at desc limit 1`,
        [expense.account_id],
      );
      if (latestBalance) {
        const currentBal = Number(latestBalance.amount);
        const adjustment = nowPaid ? -paidAmount : Number(current.paid_amount);
        const newBal = currentBal + adjustment;
        // Insert new balance snapshot for today
        await query(
          `insert into balances (account_id, as_of, amount)
           values ($1, current_date, $2)
           on conflict (account_id, as_of) do update set amount = $2`,
          [expense.account_id, newBal],
        );
      }
    }
  }

  res.json({ payment: shapePayment(row) });
}));

// ------------------------------------------------------------------ calendar
expensesRouter.get('/calendar/:month', route(async (req, res) => {
  if (!MONTH.test(req.params.month)) return res.status(400).json({ error: 'month must look like 2026-08' });
  const period = `${req.params.month}-01`;
  await ensurePeriod(period);
  // The visible grid can spill into neighbouring months.
  await ensurePeriod(addMonths(period, -1));
  await ensurePeriod(addMonths(period, 1));

  const rows = await many(
    `select p.id, p.due_date, p.amount, p.paid_on, e.name, e.category, e.due_day
       from expense_payments p join expenses e on e.id = p.expense_id
      where p.period between $1::date and $2::date and e.due_day is not null
      order by p.due_date`,
    [addMonths(period, -1), addMonths(period, 1)],
  );

  const today = todayISO();
  res.json({
    month: req.params.month,
    today,
    days: rows.map((r) => {
      const due = r.due_date.toISOString().slice(0, 10);
      return {
        id: r.id,
        dueDate: due,
        name: r.name,
        category: r.category,
        amount: Number(r.amount),
        paidOn: r.paid_on ? r.paid_on.toISOString().slice(0, 10) : null,
        overdue: !r.paid_on && compare(due, today) < 0,
      };
    }),
  });
}));

export { monthStart, dueDateFor };
