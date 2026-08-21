#!/usr/bin/env node
/**
 * Loads the parsed dashboard content into the database. Idempotent: figures key
 * on slug, dated entries on (date, first 80 chars of body), poems on title.
 * Running it twice does not duplicate anything and does not clobber edits made
 * in the app, because it only inserts what is missing.
 */
import path from 'node:path';
import { readFileSync } from 'node:fs';

import { ROOT } from '../src/lib/env.js';
import { closePool, one, query } from '../src/lib/db.js';

const file = process.argv[2] || path.join(ROOT, 'scripts/dashboard-content.json');
const data = JSON.parse(readFileSync(file, 'utf8'));

const counts = { figures: 0, journal: 0, work: 0, poems: 0, skipped: 0 };

async function seedFigures() {
  for (const f of data.figures) {
    const r = await one(
      `insert into figures (ordinal, slug, name, epithet, lifespan, chip_date, summary, body, quote, quote_source)
            values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (slug) do nothing returning id`,
      [f.ordinal, f.slug, f.name, f.epithet, f.lifespan || '', f.chipDate || '',
        f.summary || '', f.body || '', f.quote || '', f.quoteSource || ''],
    );
    if (r) counts.figures += 1; else counts.skipped += 1;
  }
}

async function seedDated(rows, table, key) {
  for (const e of rows) {
    const exists = await one(
      `select id from ${table} where entry_date = $1 and left(body, 80) = left($2, 80)`,
      [e.entryDate, e.body],
    );
    if (exists) { counts.skipped += 1; continue; }
    const insert = table === 'journal_entries'
      ? query(`insert into ${table} (entry_date, title, body, mood) values ($1,$2,$3,'')`,
        [e.entryDate, e.title || '', e.body])
      : query(`insert into ${table} (entry_date, title, body) values ($1,$2,$3)`,
        [e.entryDate, e.title || '', e.body]);
    await insert;
    counts[key] += 1;
  }
}

async function seedPoems() {
  for (const p of data.poems) {
    const exists = await one('select id from poems where lower(title) = lower($1)', [p.title]);
    if (exists) { counts.skipped += 1; continue; }
    await query(
      'insert into poems (title, body, written_on, note, sort_order) values ($1,$2,$3,$4,$5)',
      [p.title, p.body, p.writtenOn || '', p.note || '', p.sortOrder || 100],
    );
    counts.poems += 1;
  }
}

try {
  await seedFigures();
  await seedDated(data.journal, 'journal_entries', 'journal');
  await seedDated(data.work, 'work_log', 'work');
  await seedPoems();

  const totals = await one(`select
      (select count(*) from figures)         as figures,
      (select count(*) from journal_entries) as journal,
      (select count(*) from work_log)        as work,
      (select count(*) from poems)           as poems`);

  console.log('inserted', counts);
  console.log('totals  ', totals);
} finally {
  await closePool();
}
