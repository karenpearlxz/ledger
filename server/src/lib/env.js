import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '../../..');

loadDotenv({ path: path.join(ROOT, '.env'), quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`[ledger] missing required env var ${name}`);
    process.exit(1);
  }
  return value;
}

const passcode = required('LEDGER_PASSCODE');
if (passcode.length < 8) {
  console.error('[ledger] LEDGER_PASSCODE must be at least 8 characters');
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 8600),
  DATABASE_URL: required('DATABASE_URL'),
  DATABASE_SCHEMA: process.env.DATABASE_SCHEMA || 'ledger',
  DATABASE_SSL: process.env.DATABASE_SSL !== '0',
  DATABASE_POOL_MAX: Number(process.env.DATABASE_POOL_MAX || 5),
  JWT_SECRET: required('JWT_SECRET'),
  LEDGER_PASSCODE: passcode,
  APP_ORIGIN: process.env.APP_ORIGIN || '',
};
