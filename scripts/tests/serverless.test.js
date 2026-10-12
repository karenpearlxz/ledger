import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { SignJWT } from 'jose';

// No real database connections or writes. Model an existing valid session
// and empty read-only Swertres tables to exercise the actual wrapper/router.
process.env.LEDGER_PASSCODE = 'test-passcode';
process.env.JWT_SECRET = 'serverless-regression-test-secret';
process.env.DATABASE_URL = 'postgres://unused:unused@127.0.0.1:1/unused';
const { getPool, closePool } = await import('../../server/src/lib/db.js');
const pool = getPool();
let connects = 0;
const statements = [];
pool.query = async (sql) => {
  assert.match(sql, /^select id, created_at from sessions/);
  return { rows: [{ id: 'existing-test-session', created_at: new Date() }] };
};
pool.connect = async () => {
  connects++;
  return {
    async query(sql) {
      statements.push(sql);
      assert.match(sql, /^(select |BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY$|COMMIT$|ROLLBACK$)/);
      return { rows: [] };
    },
    release() {},
  };
};
const { default: app } = await import('../../api/index.js');

test('Vercel wrapper mounts Swertres with auth, including rewrite query', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  const token = await new SignJWT({ sid: 'existing-test-session' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  try {
    for (const path of ['/api/swertres', '/api/swertres?path=swertres']) {
      await t.test(path + ' returns locked without auth', async () => {
        const res = await fetch(base + path);
        assert.equal(res.status, 401);
        assert.deepEqual(await res.json(), { error: 'locked' });
        assert.equal(connects, 0);
      });
    }
    await t.test('invalid cookie remains locked', async () => {
      const res = await fetch(base + '/api/swertres?path=swertres', {
        headers: { Cookie: 'ledger_session=invalid' },
      });
      assert.equal(res.status, 401);
      assert.deepEqual(await res.json(), { error: 'locked' });
      assert.equal(connects, 0);
    });
    for (const path of ['/api/swertres', '/api/swertres?path=swertres']) {
      await t.test(path + ' reaches read-only router with valid session', async () => {
        const res = await fetch(base + path, {
          headers: { Cookie: 'ledger_session=' + token },
        });
        assert.equal(res.status, 200);
        assert.equal(res.headers.get('cache-control'), 'no-store');
        const data = await res.json();
        assert.deepEqual(data.picks, []);
        assert.deepEqual(data.results, []);
        assert.ok(Array.isArray(data.history));
      });
    }
    assert.equal(connects, 2);
    assert.equal(statements.filter(sql => sql === 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY').length, 2);
    assert.equal(statements.filter(sql => sql === 'COMMIT').length, 2);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await closePool();
  }
});
