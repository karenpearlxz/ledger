import { SignJWT, jwtVerify } from 'jose';

import { env } from './env.js';
import { one, query } from './db.js';

const COOKIE = 'ledger_session';
const TTL_DAYS = 60;
const secret = new TextEncoder().encode(env.JWT_SECRET);

/**
 * There is one user, so a session is just a revocable row. The cookie carries
 * a signed session id; deleting the row kills the token immediately instead of
 * leaving a valid JWT alive until it expires.
 */
export async function createSession(res, label = '') {
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  const row = await one(
    'insert into sessions (label, expires_at) values ($1, $2) returning id',
    [label.slice(0, 120), expiresAt],
  );

  const token = await new SignJWT({ sid: row.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secret);

  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

export async function readSession(req) {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;

  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret));
  } catch {
    return null;
  }

  const row = await one(
    'select id, created_at from sessions where id = $1 and expires_at > now()',
    [payload.sid],
  );
  return row ? { sessionId: row.id } : null;
}

export async function destroySession(req, res) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      await query('delete from sessions where id = $1', [payload.sid]);
    } catch { /* unreadable cookie has nothing to revoke */ }
  }
  res.clearCookie(COOKIE, { path: '/' });
}

export async function pruneSessions() {
  try {
    await query('delete from sessions where expires_at < now()');
  } catch (err) {
    console.error('[ledger] session prune failed', err.message);
  }
}
