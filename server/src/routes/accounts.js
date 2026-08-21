import express from 'express';
import { z } from 'zod';

import { many, one, query } from '../lib/db.js';
import { badRequest, isoDate, route } from '../lib/http.js';

export const accountsRouter = express.Router();

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const amount = z.coerce.number().min(-99_999_999).max(99_999_999).finite();

const accountBody = z.object({
  name: z.string().trim().min(1).max(60),
  kind: z.enum(['bank', 'ewallet', 'savings', 'cash', 'credit']).default('bank'),
  currency: z.enum(['PHP', 'USD']).default('PHP'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2F5D50'),
  note: z.string().max(200).default(''),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

const shape = (r) => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  currency: r.currency,
  color: r.color,
  note: r.note,
  sortOrder: r.sort_order,
  balance: r.balance === null || r.balance === undefined ? null : Number(r.balance),
  balanceAsOf: isoDate(r.balance_as_of),
});

const withBalances = `
  select a.*, b.amount as balance, b.as_of as balance_as_of
    from accounts a
    left join lateral (
      select amount, as_of from balances
       where account_id = a.id order by as_of desc limit 1
    ) b on true
   where a.archived_at is null
   order by a.sort_order, lower(a.name)`;

accountsRouter.get('/', route(async (_req, res) => {
  const rows = await many(withBalances);
  res.json({ accounts: rows.map(shape) });
}));

accountsRouter.post('/', route(async (req, res) => {
  const parsed = accountBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;
  const row = await one(
    `insert into accounts (name, kind, currency, color, note, sort_order)
          values ($1,$2,$3,$4,$5, coalesce($6, 100)) returning *`,
    [b.name, b.kind, b.currency, b.color, b.note, b.sortOrder ?? null],
  );
  res.status(201).json({ account: shape(row) });
}));

accountsRouter.patch('/:id', route(async (req, res) => {
  const parsed = accountBody.partial().safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;
  const current = await one('select * from accounts where id = $1 and archived_at is null', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'no such account' });

  const row = await one(
    `update accounts set name=$2, kind=$3, currency=$4, color=$5, note=$6, sort_order=$7
      where id=$1 returning *`,
    [req.params.id, b.name ?? current.name, b.kind ?? current.kind, b.currency ?? current.currency,
      b.color ?? current.color, b.note ?? current.note, b.sortOrder ?? current.sort_order],
  );
  res.json({ account: shape(row) });
}));

accountsRouter.delete('/:id', route(async (req, res) => {
  const found = await one('select id from accounts where id = $1', [req.params.id]);
  if (!found) return res.status(404).json({ error: 'no such account' });
  await query('update accounts set archived_at = now() where id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ balances
accountsRouter.put('/:id/balance', route(async (req, res) => {
  const parsed = z.object({ amount, asOf: z.string().regex(DATE).optional() }).safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);

  const account = await one('select id from accounts where id = $1 and archived_at is null', [req.params.id]);
  if (!account) return res.status(404).json({ error: 'no such account' });

  const row = await one(
    `insert into balances (account_id, as_of, amount)
          values ($1, coalesce($2::date, current_date), $3)
     on conflict (account_id, as_of) do update set amount = excluded.amount
       returning as_of, amount`,
    [req.params.id, parsed.data.asOf ?? null, parsed.data.amount],
  );
  res.json({ balance: { asOf: isoDate(row.as_of), amount: Number(row.amount) } });
}));

/** Net worth over time: the latest known balance of every account, per day. */
accountsRouter.get('/networth', route(async (req, res) => {
  const months = Math.min(Math.max(Number(req.query.months) || 12, 1), 60);
  const rows = await many(
    `with days as (
        select distinct as_of from balances
         where as_of >= (current_date - make_interval(months => $1))
      )
      select d.as_of,
             sum(coalesce(latest.amount, 0)) as total
        from days d
        cross join accounts a
        left join lateral (
          select amount from balances b
           where b.account_id = a.id and b.as_of <= d.as_of
           order by b.as_of desc limit 1
        ) latest on true
       where a.archived_at is null
       group by d.as_of
       order by d.as_of`,
    [months],
  );
  res.json({ series: rows.map((r) => ({ asOf: isoDate(r.as_of), total: Number(r.total) })) });
}));

accountsRouter.get('/:id/history', route(async (req, res) => {
  const rows = await many(
    'select as_of, amount from balances where account_id = $1 order by as_of desc limit 120',
    [req.params.id],
  );
  res.json({ history: rows.map((r) => ({ asOf: isoDate(r.as_of), amount: Number(r.amount) })) });
}));
