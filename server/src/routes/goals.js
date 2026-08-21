import express from 'express';
import { z } from 'zod';

import { many, one, query } from '../lib/db.js';
import { badRequest, isoDate, route } from '../lib/http.js';

export const goalsRouter = express.Router();

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const goalBody = z.object({
  name: z.string().trim().min(1).max(60),
  targetAmount: z.coerce.number().positive().max(999_999_999),
  targetDate: z.string().regex(DATE).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#C6862F'),
  note: z.string().max(300).default(''),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

const shape = (r) => ({
  id: r.id,
  name: r.name,
  targetAmount: Number(r.target_amount),
  targetDate: isoDate(r.target_date),
  color: r.color,
  note: r.note,
  sortOrder: r.sort_order,
  saved: Number(r.saved || 0),
});

const listSql = `
  select g.*, coalesce(c.total, 0) as saved
    from goals g
    left join (
      select goal_id, sum(amount) as total from goal_contributions group by goal_id
    ) c on c.goal_id = g.id
   where g.archived_at is null
   order by g.sort_order, lower(g.name)`;

goalsRouter.get('/', route(async (_req, res) => {
  const rows = await many(listSql);
  res.json({ goals: rows.map(shape) });
}));

goalsRouter.post('/', route(async (req, res) => {
  const parsed = goalBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;
  const row = await one(
    `insert into goals (name, target_amount, target_date, color, note, sort_order)
          values ($1,$2,$3,$4,$5, coalesce($6, 100)) returning *`,
    [b.name, b.targetAmount, b.targetDate ?? null, b.color, b.note, b.sortOrder ?? null],
  );
  res.status(201).json({ goal: shape({ ...row, saved: 0 }) });
}));

goalsRouter.patch('/:id', route(async (req, res) => {
  const parsed = goalBody.partial().safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;
  const current = await one('select * from goals where id = $1 and archived_at is null', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'no such goal' });

  await query(
    `update goals set name=$2, target_amount=$3, target_date=$4, color=$5, note=$6, sort_order=$7 where id=$1`,
    [req.params.id, b.name ?? current.name, b.targetAmount ?? Number(current.target_amount),
      b.targetDate === undefined ? current.target_date : b.targetDate,
      b.color ?? current.color, b.note ?? current.note, b.sortOrder ?? current.sort_order],
  );
  const rows = await many(`${listSql}`);
  res.json({ goal: rows.map(shape).find((g) => g.id === req.params.id) });
}));

goalsRouter.delete('/:id', route(async (req, res) => {
  const found = await one('select id from goals where id = $1', [req.params.id]);
  if (!found) return res.status(404).json({ error: 'no such goal' });
  await query('update goals set archived_at = now() where id = $1', [req.params.id]);
  res.json({ ok: true });
}));

goalsRouter.get('/:id/contributions', route(async (req, res) => {
  const rows = await many(
    'select id, on_date, amount, note from goal_contributions where goal_id = $1 order by on_date desc, created_at desc',
    [req.params.id],
  );
  res.json({
    contributions: rows.map((r) => ({
      id: r.id, onDate: isoDate(r.on_date), amount: Number(r.amount), note: r.note,
    })),
  });
}));

goalsRouter.post('/:id/contributions', route(async (req, res) => {
  const parsed = z.object({
    // Negative is a withdrawal from the pot, which does happen.
    amount: z.coerce.number().finite().refine((n) => n !== 0, 'a contribution of zero does nothing'),
    onDate: z.string().regex(DATE).optional(),
    note: z.string().max(200).default(''),
  }).safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);

  const goal = await one('select id from goals where id = $1 and archived_at is null', [req.params.id]);
  if (!goal) return res.status(404).json({ error: 'no such goal' });

  const row = await one(
    `insert into goal_contributions (goal_id, on_date, amount, note)
          values ($1, coalesce($2::date, current_date), $3, $4) returning id, on_date, amount, note`,
    [req.params.id, parsed.data.onDate ?? null, parsed.data.amount, parsed.data.note],
  );
  res.status(201).json({
    contribution: { id: row.id, onDate: isoDate(row.on_date), amount: Number(row.amount), note: row.note },
  });
}));

goalsRouter.delete('/contributions/:id', route(async (req, res) => {
  const found = await one('select id from goal_contributions where id = $1', [req.params.id]);
  if (!found) return res.status(404).json({ error: 'no such contribution' });
  await query('delete from goal_contributions where id = $1', [req.params.id]);
  res.json({ ok: true });
}));
