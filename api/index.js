// Vercel serverless function wrapper for Express app
// Static files are served by Vercel's CDN, not this function

import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';

import { env } from '../server/src/lib/env.js';
import { attachSession, requireSession } from '../server/src/middleware/auth.js';
import { accountsRouter } from '../server/src/routes/accounts.js';
import { authRouter } from '../server/src/routes/auth.js';
import { contentRouter } from '../server/src/routes/content.js';
import { expensesRouter } from '../server/src/routes/expenses.js';
import { salaryRouter } from '../server/src/routes/salary.js';
import { goalsRouter } from '../server/src/routes/goals.js';
import { overviewRouter } from '../server/src/routes/overview.js';
import { transactionsRouter } from '../server/src/routes/transactions.js';
import { swertresRouter } from '../server/src/routes/swertres.js';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
}));

app.use(compression());
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use(attachSession);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ledger', env: env.NODE_ENV, runtime: 'vercel', version: 'cf078fb' });
});

app.use('/api/auth', authRouter);

app.use('/api/finance', requireSession, overviewRouter);
app.use('/api/expenses', requireSession, expensesRouter);
app.use('/api/accounts', requireSession, accountsRouter);
app.use('/api/goals', requireSession, goalsRouter);
app.use('/api/salary', requireSession, salaryRouter);
app.use('/api/transactions', requireSession, transactionsRouter);
app.use('/api/content', requireSession, contentRouter);
app.use('/api/swertres', requireSession, swertresRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: `no route for ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ledger] unhandled', err);
  res.status(500).json({ error: err.message || 'something broke on our end' });
});

export default app;
