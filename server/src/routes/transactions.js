import express from 'express';
import { z } from 'zod';

import { many, one, query } from '../lib/db.js';
import { addMonths, monthStart, todayISO } from '../lib/dates.js';
import { badRequest, isoDate, route } from '../lib/http.js';

export const transactionsRouter = express.Router();

const MONTH = /^\d{4}-\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const body = z.object({
  onDate: z.string().regex(DATE).optional(),
  description: z.string().trim().min(1).max(120),
  amount: z.coerce.number().min(0).max(99_999_999).finite(),
  kind: z.enum(['expense', 'income', 'transfer']).default('expense'),
  category: z.string().trim().min(1).max(40).default('Other'),
  accountId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).default(''),
});

const shape = (r) => ({
  id: r.id,
  onDate: isoDate(r.on_date),
  description: r.description,
  amount: Number(r.amount),
  kind: r.kind,
  category: r.category,
  accountId: r.account_id,
  notes: r.notes,
});

transactionsRouter.get('/', route(async (req, res) => {
  const month = MONTH.test(String(req.query.month || '')) ? `${req.query.month}-01` : null;
  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);

  const rows = month
    ? await many(
      `select * from transactions where on_date >= $1::date and on_date < $2::date
        order by on_date desc, created_at desc limit $3`,
      [month, addMonths(month, 1), limit],
    )
    : await many('select * from transactions order by on_date desc, created_at desc limit $1', [limit]);

  res.json({ transactions: rows.map(shape) });
}));

transactionsRouter.post('/', route(async (req, res) => {
  const parsed = body.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;

  if (b.accountId) {
    const account = await one('select id from accounts where id = $1 and archived_at is null', [b.accountId]);
    if (!account) return res.status(400).json({ error: 'that account does not exist' });
  }

  const row = await one(
    `insert into transactions (on_date, description, amount, kind, category, account_id, notes)
          values (coalesce($1::date, current_date), $2, $3, $4, $5, $6, $7) returning *`,
    [b.onDate ?? null, b.description, b.amount, b.kind, b.category, b.accountId ?? null, b.notes],
  );
  res.status(201).json({ transaction: shape(row) });
}));

transactionsRouter.patch('/:id', route(async (req, res) => {
  const parsed = body.partial().safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;
  const current = await one('select * from transactions where id = $1', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'no such transaction' });

  const row = await one(
    `update transactions set on_date=$2, description=$3, amount=$4, kind=$5, category=$6,
            account_id=$7, notes=$8, updated_at=now() where id=$1 returning *`,
    [req.params.id, b.onDate ?? isoDate(current.on_date), b.description ?? current.description,
      b.amount ?? Number(current.amount), b.kind ?? current.kind, b.category ?? current.category,
      b.accountId === undefined ? current.account_id : b.accountId, b.notes ?? current.notes],
  );
  res.json({ transaction: shape(row) });
}));

transactionsRouter.delete('/:id', route(async (req, res) => {
  const found = await one('select id from transactions where id = $1', [req.params.id]);
  if (!found) return res.status(404).json({ error: 'no such transaction' });
  await query('delete from transactions where id = $1', [req.params.id]);
  res.json({ ok: true });
}));

/**
 * Spending trend and category split. Actual transactions are the truth here;
 * planned bills live in expense_payments and are reported separately, because
 * mixing "what I owe" with "what I spent" is how a tracker starts lying.
 */
transactionsRouter.get('/insights', route(async (req, res) => {
  const months = Math.min(Math.max(Number(req.query.months) || 6, 1), 24);
  const from = addMonths(monthStart(todayISO()), -(months - 1));

  const trend = await many(
    `select to_char(date_trunc('month', on_date), 'YYYY-MM') as month,
            sum(amount) filter (where kind = 'expense') as spent,
            sum(amount) filter (where kind = 'income')  as earned
       from transactions where on_date >= $1::date
      group by 1 order by 1`,
    [from],
  );

  const byCategory = await many(
    `select t.category,
            sum(t.amount) as total,
            count(*)      as count,
            coalesce(max(c.color), '#A8B0AE') as color
       from transactions t
       left join categories c on c.name_lower = lower(t.category)
      where t.kind = 'expense' and t.on_date >= $1::date
      group by t.category order by total desc`,
    [from],
  );

  const paid = await many(
    `select to_char(period, 'YYYY-MM') as month, sum(coalesce(paid_amount, 0)) as paid, sum(amount) as billed
       from expense_payments where period >= $1::date group by 1 order by 1`,
    [from],
  );

  res.json({
    months,
    from,
    trend: trend.map((r) => ({ month: r.month, spent: Number(r.spent || 0), earned: Number(r.earned || 0) })),
    byCategory: byCategory.map((r) => ({
      category: r.category, total: Number(r.total), count: Number(r.count), color: r.color,
    })),
    bills: paid.map((r) => ({ month: r.month, paid: Number(r.paid), billed: Number(r.billed) })),
  });
}));
