import crypto from 'node:crypto';

import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { env } from '../lib/env.js';
import { route } from '../lib/http.js';
import { createSession, destroySession } from '../lib/sessions.js';

export const authRouter = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too many attempts, wait a few minutes' },
});

const body = z.object({ passcode: z.string().min(1).max(200) });

/** Constant time, so the endpoint cannot be used to learn the passcode length. */
function passcodeMatches(given) {
  const a = crypto.createHash('sha256').update(String(given)).digest();
  const b = crypto.createHash('sha256').update(env.LEDGER_PASSCODE).digest();
  return crypto.timingSafeEqual(a, b);
}

authRouter.post('/unlock', limiter, route(async (req, res) => {
  const parsed = body.safeParse(req.body);
  if (!parsed.success || !passcodeMatches(parsed.data.passcode)) {
    return res.status(401).json({ error: 'wrong passcode' });
  }
  await createSession(res, String(req.headers['user-agent'] || '').slice(0, 120));
  res.json({ ok: true });
}));

authRouter.post('/lock', route(async (req, res) => {
  await destroySession(req, res);
  res.json({ ok: true });
}));

authRouter.get('/me', (req, res) => {
  res.json({ unlocked: Boolean(req.session) });
});
