import { readSession } from '../lib/sessions.js';
import { isMissingSchema } from '../lib/db.js';

/** Attaches req.session when the cookie is valid. Never rejects. */
export async function attachSession(req, _res, next) {
  try {
    req.session = await readSession(req);
  } catch (err) {
    if (!isMissingSchema(err)) console.error('[ledger] session read failed', err.message);
    req.session = null;
  }
  next();
}

/** Everything that touches Karen's data goes through this. */
export function requireSession(req, res, next) {
  if (!req.session) return res.status(401).json({ error: 'locked' });
  next();
}
