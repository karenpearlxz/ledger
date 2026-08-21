import { createApp } from './app.js';
import { closePool } from './lib/db.js';
import { env } from './lib/env.js';
import { pruneSessions } from './lib/sessions.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[ledger] api on http://localhost:${env.PORT} env=${env.NODE_ENV} schema=${env.DATABASE_SCHEMA}`);
});

pruneSessions();
setInterval(pruneSessions, 6 * 60 * 60 * 1000).unref();

const shutdown = (signal) => async () => {
  console.log(`[ledger] ${signal}, shutting down`);
  server.close(async () => { await closePool(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));
