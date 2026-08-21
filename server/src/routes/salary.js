import express from 'express';
import { z } from 'zod';

import { many, one, query } from '../lib/db.js';
import { badRequest, isoDate, route } from '../lib/http.js';

export const salaryRouter = express.Router();

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const rateBody = z.object({
  effectiveFrom: z.string().regex(DATE),
  amountUsd: z.coerce.number().min(0).max(1_000_000).finite(),
  note: z.string().max(200).default(''),
});

const overrideBody = z.object({
  amount: z.coerce.number().min(0).max(999_999_999).finite(),
  currency: z.enum(['PHP', 'USD']).default('PHP'),
  note: z.string().max(200).default(''),
});

const shapeRate = (r) => ({
  id: r.id,
  effectiveFrom: isoDate(r.effective_from),
  amountUsd: Number(r.amount_usd),
  note: r.note,
});

const shapeOverride = (r) => ({
  payDate: isoDate(r.pay_date),
  amount: Number(r.amount),
  currency: r.currency,
  note: r.note,
});

/** Newest rate first: `rateOn` walks the list and takes the first that applies. */
export const listRates = () => many('select * from salary_rates order by effective_from desc');
export const listOverrides = () => many('select * from paycheck_overrides order by pay_date desc');

salaryRouter.get('/', route(async (_req, res) => {
  const [rates, overrides] = await Promise.all([listRates(), listOverrides()]);
  res.json({ rates: rates.map(shapeRate), overrides: overrides.map(shapeOverride) });
}));

salaryRouter.post('/rates', route(async (req, res) => {
  const parsed = rateBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;

  // One rate per date. Re-posting the same date is a correction, not an error.
  const row = await one(
    `insert into salary_rates (effective_from, amount_usd, note) values ($1,$2,$3)
     on conflict (effective_from) do update set amount_usd = excluded.amount_usd, note = excluded.note
     returning *`,
    [b.effectiveFrom, b.amountUsd, b.note],
  );
  res.status(201).json({ rate: shapeRate(row) });
}));

salaryRouter.patch('/rates/:id', route(async (req, res) => {
  const parsed = rateBody.partial().safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const current = await one('select * from salary_rates where id = $1', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'no such rate' });
  const b = parsed.data;

  const clash = b.effectiveFrom && b.effectiveFrom !== isoDate(current.effective_from)
    ? await one('select id from salary_rates where effective_from = $1', [b.effectiveFrom])
    : null;
  if (clash) return res.status(409).json({ error: 'a rate already starts on that date' });

  const row = await one(
    'update salary_rates set effective_from=$2, amount_usd=$3, note=$4 where id=$1 returning *',
    [req.params.id,
      b.effectiveFrom ?? isoDate(current.effective_from),
      b.amountUsd ?? Number(current.amount_usd),
      b.note ?? current.note],
  );
  res.json({ rate: shapeRate(row) });
}));

salaryRouter.delete('/rates/:id', route(async (req, res) => {
  const found = await one('select id from salary_rates where id = $1', [req.params.id]);
  if (!found) return res.status(404).json({ error: 'no such rate' });
  await query('delete from salary_rates where id = $1', [req.params.id]);
  res.json({ ok: true });
}));

/** Upsert, because the pay date is the identity. */
salaryRouter.put('/overrides/:date', route(async (req, res) => {
  if (!DATE.test(req.params.date)) return res.status(400).json({ error: 'pay date must be YYYY-MM-DD' });
  const parsed = overrideBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;

  const row = await one(
    `insert into paycheck_overrides (pay_date, amount, currency, note) values ($1,$2,$3,$4)
     on conflict (pay_date) do update
        set amount = excluded.amount, currency = excluded.currency, note = excluded.note
     returning *`,
    [req.params.date, b.amount, b.currency, b.note],
  );
  res.json({ override: shapeOverride(row) });
}));

salaryRouter.delete('/overrides/:date', route(async (req, res) => {
  if (!DATE.test(req.params.date)) return res.status(400).json({ error: 'pay date must be YYYY-MM-DD' });
  const found = await one('select pay_date from paycheck_overrides where pay_date = $1', [req.params.date]);
  if (!found) return res.status(404).json({ error: 'no override on that date' });
  await query('delete from paycheck_overrides where pay_date = $1', [req.params.date]);
  res.json({ ok: true });
}));
