import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';

import { env } from './lib/env.js';
import { attachSession, requireSession } from './middleware/auth.js';
import { accountsRouter } from './routes/accounts.js';
import { authRouter } from './routes/auth.js';
import { contentRouter } from './routes/content.js';
import { expensesRouter } from './routes/expenses.js';
import { salaryRouter } from './routes/salary.js';
import { goalsRouter } from './routes/goals.js';
import { overviewRouter } from './routes/overview.js';
import { transactionsRouter } from './routes/transactions.js';
import { swertresRouter } from './routes/swertres.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'"],
        // Imported dashboard content carries inline style attributes, and
        // Tailwind injects a style element. No third-party stylesheet hosts.
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        // The exchange rate is fetched server side precisely so this can stay 'self'.
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
    res.json({ ok: true, service: 'ledger', env: env.NODE_ENV });
  });

  app.use('/api/auth', authRouter);

  // Everything below is Karen's data.
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

  const here = path.dirname(fileURLToPath(import.meta.url));
  const dist = path.resolve(here, '../../client/dist');

  if (existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist, {
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.endsWith(`${path.sep}sw.js`)) {
          // A cached service worker is a permanently stuck app.
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Service-Worker-Allowed', '/');
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));

    // Anything that is not /api falls through to the SPA, so a mistyped API
    // path still returns JSON instead of index.html.
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[ledger] unhandled', err);
    res.status(500).json({ error: 'something broke on our end' });
  });

  return app;
}

export default createApp;
