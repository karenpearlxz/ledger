# Ledger — deployment

Karen's private finance tracker and life dashboard. Single user.

## Where it runs
- Source: `/home/kit/ledger`
- API + static: port **8600**, process `node server/src/dev.js`, log `/tmp/ledger.log`
- Live: https://warily-vigilantly-factual-catbird.kitten.space
- Autostart: a line in `/.hako/init.sh` calls `server/scripts/restart.sh`

## Database
- Supabase project `onnkgvfrbppwdhbyrtba`, schema **`ledger`** only.
- Nothing here reads or writes `public`, `reno` or any other schema. The pool
  pins `search_path=ledger` at connection start.
- Every table has RLS enabled and `anon` / `authenticated` are revoked, so a
  leaked Supabase anon key cannot read her journal. Express connects as the
  owner and is the only way in.

## Trust model
One person, but the URL is guessable and the contents are her salary, bank
balances and journal. So the app sits behind a single passcode: no accounts,
no signup, no user table. `LEDGER_PASSCODE` is checked in constant time, and a
success writes a row in `ledger.sessions`; the cookie carries a signed session
id, so deleting the row revokes access immediately.

## Environment (`.env`, never committed)
`NODE_ENV`, `PORT`, `DATABASE_URL`, `DATABASE_SCHEMA`, `DATABASE_SSL`,
`DATABASE_POOL_MAX`, `JWT_SECRET`, `LEDGER_PASSCODE`, `APP_ORIGIN`.

## Commands
| command | what it does |
| --- | --- |
| `npm run migrate` | applies `supabase/migrations/*.sql`, idempotent, checksummed |
| `npm run build` | builds the client and stamps the service worker |
| `npm run restart` | kills whatever holds :8600 and verifies the new process answers |
| `npm run import` | parses `/home/kit/dashboard/index.html` into JSON |
| `npm run seed` | loads that JSON into the database (idempotent) |
| `node server/scripts/seed-finance.js` | her known fixed costs and accounts (idempotent) |
| `node server/scripts/math-check.js` | 30 pure date/payroll checks, no network |
| `npm run smoke` | 97 API checks over real HTTP against a running server |
| `npm run ui` | 112 browser checks against the live HTTPS URL |
| `node server/scripts/clean-fixtures.js` | removes anything a test run left behind |

## Rules learned the hard way
- The browser suite writes to the **live** database. Cleanup is in a `finally`,
  fixtures carry a per-run id, and a lockfile refuses a second concurrent run.
- Always rebuild **and** restart after a client change: the static handler is
  mounted at boot based on whether `client/dist` exists.
- Run the browser suite against the HTTPS URL, never localhost.
