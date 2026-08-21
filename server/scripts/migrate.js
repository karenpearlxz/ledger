#!/usr/bin/env node
/**
 * Applies every .sql file in supabase/migrations, in filename order, exactly
 * once, recording each in ledger.schema_migrations.
 *
 * Uses its own client rather than the app pool: the pool pins search_path to a
 * schema that does not exist yet on a first run.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.resolve(here, '../../.env'), quiet: true });

const migrationsDir = path.resolve(here, '../../supabase/migrations');
const dryRun = process.argv.includes('--dry');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: process.env.DATABASE_SSL === '0' ? false : { rejectUnauthorized: false },
});

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

async function main() {
  await client.connect();

  await client.query('create schema if not exists ledger');
  await client.query(`
    create table if not exists ledger.schema_migrations (
      name       text primary key,
      checksum   text not null,
      applied_at timestamptz not null default now()
    )`);
  await client.query('alter table ledger.schema_migrations enable row level security');
  await client.query('revoke all on ledger.schema_migrations from anon, authenticated');

  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  const { rows } = await client.query('select name, checksum from ledger.schema_migrations');
  const applied = new Map(rows.map((r) => [r.name, r.checksum]));

  let ran = 0;

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    const checksum = sha(sql);
    const previous = applied.get(file);

    if (previous) {
      if (previous !== checksum) {
        console.error(`\n  ${file} changed after being applied. Migrations are immutable; add a new file.\n`);
        process.exitCode = 1;
      } else {
        console.log(`  skip   ${file}`);
      }
      continue;
    }

    if (dryRun) {
      console.log(`  would  ${file}`);
      continue;
    }

    process.stdout.write(`  apply  ${file} ... `);
    try {
      await client.query(sql);
      await client.query('insert into ledger.schema_migrations (name, checksum) values ($1, $2)', [file, checksum]);
      console.log('ok');
      ran += 1;
    } catch (err) {
      console.log('FAILED');
      console.error(`\n${err.message}\n`);
      throw err;
    }
  }

  console.log(`\n${ran} migration(s) applied.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
