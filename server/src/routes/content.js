import express from 'express';
import { z } from 'zod';

import { many, one, query } from '../lib/db.js';
import { badRequest, isoDate, route } from '../lib/http.js';

export const contentRouter = express.Router();

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// ------------------------------------------------------------------- figures
contentRouter.get('/figures', route(async (req, res) => {
  const full = req.query.full === '1';
  const rows = await many(
    full
      ? 'select * from figures order by ordinal desc'
      : `select id, ordinal, slug, name, epithet, lifespan, chip_date, summary, quote, quote_source
           from figures order by ordinal desc`,
  );
  res.json({
    figures: rows.map((r) => ({
      id: r.id, ordinal: r.ordinal, slug: r.slug, name: r.name, epithet: r.epithet,
      lifespan: r.lifespan, chipDate: r.chip_date, summary: r.summary,
      quote: r.quote, quoteSource: r.quote_source, body: r.body,
    })),
  });
}));

contentRouter.get('/figures/:slug', route(async (req, res) => {
  const r = await one('select * from figures where slug = $1', [req.params.slug]);
  if (!r) return res.status(404).json({ error: 'no such figure' });
  res.json({
    figure: {
      id: r.id, ordinal: r.ordinal, slug: r.slug, name: r.name, epithet: r.epithet,
      lifespan: r.lifespan, chipDate: r.chip_date, summary: r.summary, body: r.body,
      quote: r.quote, quoteSource: r.quote_source,
    },
  });
}));

// ------------------------------------------------------------ dated entries --
// Journal and the work log are the same shape, so they share one implementation
// rather than two that drift apart.
const datedTables = { journal: 'journal_entries', work: 'work_log' };

const datedBody = z.object({
  entryDate: z.string().regex(DATE),
  title: z.string().trim().max(120).default(''),
  body: z.string().trim().min(1).max(20_000),
  mood: z.string().trim().max(40).default(''),
});

const shapeDated = (r) => ({
  id: r.id,
  entryDate: isoDate(r.entry_date),
  title: r.title,
  body: r.body,
  mood: r.mood ?? '',
});

for (const [name, table] of Object.entries(datedTables)) {
  const hasMood = table === 'journal_entries';

  contentRouter.get(`/${name}`, route(async (_req, res) => {
    const rows = await many(`select * from ${table} order by entry_date desc, created_at desc`);
    res.json({ entries: rows.map(shapeDated) });
  }));

  contentRouter.post(`/${name}`, route(async (req, res) => {
    const parsed = datedBody.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed);
    const b = parsed.data;
    const row = hasMood
      ? await one(`insert into ${table} (entry_date, title, body, mood) values ($1,$2,$3,$4) returning *`,
        [b.entryDate, b.title, b.body, b.mood])
      : await one(`insert into ${table} (entry_date, title, body) values ($1,$2,$3) returning *`,
        [b.entryDate, b.title, b.body]);
    res.status(201).json({ entry: shapeDated(row) });
  }));

  contentRouter.patch(`/${name}/:id`, route(async (req, res) => {
    const parsed = datedBody.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed);
    const b = parsed.data;
    const current = await one(`select * from ${table} where id = $1`, [req.params.id]);
    if (!current) return res.status(404).json({ error: 'no such entry' });

    const row = hasMood
      ? await one(
        `update ${table} set entry_date=$2, title=$3, body=$4, mood=$5, updated_at=now() where id=$1 returning *`,
        [req.params.id, b.entryDate ?? isoDate(current.entry_date), b.title ?? current.title,
          b.body ?? current.body, b.mood ?? current.mood])
      : await one(
        `update ${table} set entry_date=$2, title=$3, body=$4, updated_at=now() where id=$1 returning *`,
        [req.params.id, b.entryDate ?? isoDate(current.entry_date), b.title ?? current.title,
          b.body ?? current.body]);
    res.json({ entry: shapeDated(row) });
  }));

  contentRouter.delete(`/${name}/:id`, route(async (req, res) => {
    const found = await one(`select id from ${table} where id = $1`, [req.params.id]);
    if (!found) return res.status(404).json({ error: 'no such entry' });
    await query(`delete from ${table} where id = $1`, [req.params.id]);
    res.json({ ok: true });
  }));
}

// --------------------------------------------------------------------- poems
const poemBody = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(20_000),
  writtenOn: z.string().trim().max(60).default(''),
  note: z.string().trim().max(300).default(''),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

const shapePoem = (r) => ({
  id: r.id, title: r.title, body: r.body, writtenOn: r.written_on, note: r.note, sortOrder: r.sort_order,
});

contentRouter.get('/poems', route(async (_req, res) => {
  const rows = await many('select * from poems order by sort_order, created_at');
  res.json({ poems: rows.map(shapePoem) });
}));

contentRouter.post('/poems', route(async (req, res) => {
  const parsed = poemBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;
  const row = await one(
    'insert into poems (title, body, written_on, note, sort_order) values ($1,$2,$3,$4, coalesce($5,100)) returning *',
    [b.title, b.body, b.writtenOn, b.note, b.sortOrder ?? null],
  );
  res.status(201).json({ poem: shapePoem(row) });
}));

contentRouter.patch('/poems/:id', route(async (req, res) => {
  const parsed = poemBody.partial().safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;
  const current = await one('select * from poems where id = $1', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'no such poem' });
  const row = await one(
    `update poems set title=$2, body=$3, written_on=$4, note=$5, sort_order=$6, updated_at=now()
      where id=$1 returning *`,
    [req.params.id, b.title ?? current.title, b.body ?? current.body,
      b.writtenOn ?? current.written_on, b.note ?? current.note, b.sortOrder ?? current.sort_order],
  );
  res.json({ poem: shapePoem(row) });
}));

contentRouter.delete('/poems/:id', route(async (req, res) => {
  const found = await one('select id from poems where id = $1', [req.params.id]);
  if (!found) return res.status(404).json({ error: 'no such poem' });
  await query('delete from poems where id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// -------------------------------------------------------------------- search
contentRouter.get('/search', route(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  if (q.length < 2) return res.json({ results: [] });
  // Escape LIKE wildcards so a stray % does not match everything.
  const needle = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

  const [journal, work, poems, figures] = await Promise.all([
    many(`select id, entry_date, title, body from journal_entries
           where title ilike $1 escape '\\' or body ilike $1 escape '\\'
           order by entry_date desc limit 20`, [needle]),
    many(`select id, entry_date, title, body from work_log
           where title ilike $1 escape '\\' or body ilike $1 escape '\\'
           order by entry_date desc limit 20`, [needle]),
    many(`select id, title, body from poems
           where title ilike $1 escape '\\' or body ilike $1 escape '\\' limit 20`, [needle]),
    many(`select id, slug, name, epithet from figures
           where name ilike $1 escape '\\' or epithet ilike $1 escape '\\' or body ilike $1 escape '\\'
           order by ordinal desc limit 20`, [needle]),
  ]);

  const snippet = (text) => {
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    const start = Math.max(0, i - 60);
    return `${start > 0 ? '…' : ''}${text.slice(start, start + 180)}${text.length > start + 180 ? '…' : ''}`;
  };

  res.json({
    results: [
      ...journal.map((r) => ({ type: 'journal', id: r.id, date: isoDate(r.entry_date), title: r.title, snippet: snippet(r.body) })),
      ...work.map((r) => ({ type: 'work', id: r.id, date: isoDate(r.entry_date), title: r.title, snippet: snippet(r.body) })),
      ...poems.map((r) => ({ type: 'poem', id: r.id, title: r.title, snippet: snippet(r.body) })),
      ...figures.map((r) => ({ type: 'figure', id: r.id, slug: r.slug, title: r.name, snippet: r.epithet.slice(0, 180) })),
    ],
  });
}));
