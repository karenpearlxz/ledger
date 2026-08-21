import { isMissingSchema } from './db.js';

/** Wraps an async handler so a rejected promise becomes a clean 500/503. */
export const route = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    if (isMissingSchema(err)) {
      return res.status(503).json({ error: 'the database is behind the app — run npm run migrate' });
    }
    next(err);
  }
};

export function badRequest(res, parsed) {
  const first = parsed?.error?.issues?.[0];
  const where = first?.path?.length ? `${first.path.join('.')}: ` : '';
  return res.status(400).json({ error: `${where}${first?.message || 'invalid request'}`.toLowerCase() });
}

/** Postgres numerics arrive as strings; the client wants numbers. */
export const num = (v) => (v === null || v === undefined ? null : Number(v));

export const isoDate = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
};
