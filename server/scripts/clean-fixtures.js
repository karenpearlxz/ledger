#!/usr/bin/env node
/**
 * Sweeps anything a test run left behind. Crashed suites are the normal case,
 * not the exception, so this runs before and after every browser sweep.
 */
import { closePool, many, one, query } from '../src/lib/db.js';

const LIKE = ['smoke-%', 'ui-%', 'UI test %'];

try {
  let removed = 0;
  for (const pattern of LIKE) {
    // expense_payments cascade from expenses; transactions and balances must
    // go before the account they point at.
    const txn = await query('delete from transactions where description like $1', [pattern]);
    const goals = await many('select id from goals where name like $1', [pattern]);
    for (const g of goals) await query('delete from goal_contributions where goal_id = $1', [g.id]);
    const g = await query('delete from goals where name like $1', [pattern]);
    const accts = await many('select id from accounts where name like $1', [pattern]);
    for (const a of accts) {
      await query('delete from balances where account_id = $1', [a.id]);
      await query('update transactions set account_id = null where account_id = $1', [a.id]);
    }
    const a = await query('delete from accounts where name like $1', [pattern]);
    const e = await query('delete from expenses where name like $1', [pattern]);
    removed += txn.rowCount + g.rowCount + a.rowCount + e.rowCount;
  }

  const totals = await one(`select
      (select count(*) from expenses where archived_at is null) expenses,
      (select coalesce(sum(amount),0) from expenses where archived_at is null) monthly_fixed,
      (select count(*) from accounts where archived_at is null) accounts,
      (select count(*) from goals where archived_at is null) goals,
      (select count(*) from transactions) transactions`);

  console.log(`removed ${removed} fixture row(s)`);
  console.log('real data now:', totals);
} finally {
  await closePool();
}
