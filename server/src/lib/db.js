import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

let pool;

export function getPool() {
  if (pool) return pool;

  pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    // Supabase terminates TLS with a chain Node does not ship. Encrypted, not pinned.
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
    // Pin the schema at connection start rather than in a post-connect query,
    // which would race the first real statement on a fresh client. Nothing in
    // this codebase can reach `public`, which belongs to other apps.
    options: `-c search_path=${env.DATABASE_SCHEMA}`,
  });

  pool.on('error', (err) => console.error('[ledger db] idle client error', err));
  return pool;
}

export const query = (text, params) => getPool().query(text, params);

export async function one(text, params) {
  const { rows } = await query(text, params);
  return rows[0] ?? null;
}

export async function many(text, params) {
  const { rows } = await query(text, params);
  return rows;
}

export async function transaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    try { await client.query('rollback'); } catch { /* connection already gone */ }
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool() {
  if (!pool) return;
  const p = pool;
  pool = undefined;
  await p.end();
}

/** 42P01 undefined_table, 42703 undefined_column: the schema lags the code. */
export const isMissingSchema = (err) => err?.code === '42P01' || err?.code === '42703';
