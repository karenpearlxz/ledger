#!/usr/bin/env node
/**
 * Karen's known fixed costs and accounts, so the app opens with something real
 * rather than an empty state she has to type her way out of. Idempotent by
 * name; it never overwrites an amount she has already changed.
 */
import { closePool, one, query } from '../src/lib/db.js';
import { ensureWindow } from '../src/lib/finance.js';
import { todayISO } from '../src/lib/dates.js';

const EXPENSES = [
  ['Car loan (BPI)', 20122, 7, 'Debt', 'auto-debited from BPI'],
  ['Electric bill', 6000, 20, 'Utilities', ''],
  ["Mom's allowance", 5000, 1, 'Family', ''],
  ["Dandan's milk", 3200, 1, 'Family', ''],
  ['Food allowance', 4500, null, 'Food', 'spread across the month'],
  ["Kazie's allowance", 2500, 1, 'Family', ''],
  ["Dandan's tuition", 2000, 5, 'Education', ''],
  ['Grocery', 2000, null, 'Food', 'spread across the month'],
  ['Gas', 3000, null, 'Transport', 'spread across the month'],
  ['Converge internet', 1647, 15, 'Utilities', ''],
  ['Shopee loan', 2000, 1, 'Debt', ''],
  ['TV payment', 2592, 10, 'Debt', 'last instalment April 2027'],
  ['Dandan extras', 500, null, 'Family', ''],
  ['Events buffer', 1500, null, 'Personal', ''],
];

const ACCOUNTS = [
  ['BPI', 'bank', '#B5442E', 'car loan auto-debit + savings'],
  ['GoTyme', 'ewallet', '#F0A542', 'daily spending, no transfer fees'],
  ['Maribank', 'savings', '#2F5D50', 'savings, untouchable'],
];

const added = { expenses: 0, accounts: 0, goals: 0 };

try {
  for (const [i, [name, amount, dueDay, category, notes]] of EXPENSES.entries()) {
    const exists = await one('select id from expenses where lower(name) = lower($1)', [name]);
    if (exists) continue;
    await query(
      `insert into expenses (name, amount, currency, due_day, category, is_recurring, start_date, end_date, notes, sort_order)
            values ($1,$2,'PHP',$3,$4,true,'2026-01-01',$5,$6,$7)`,
      [name, amount, dueDay, category, name === 'TV payment' ? '2027-04-30' : null, notes, (i + 1) * 10],
    );
    added.expenses += 1;
  }

  for (const [i, [name, kind, color, note]] of ACCOUNTS.entries()) {
    const exists = await one('select id from accounts where lower(name) = lower($1)', [name]);
    if (exists) continue;
    await query('insert into accounts (name, kind, currency, color, note, sort_order) values ($1,$2,$3,$4,$5,$6)',
      [name, kind, 'PHP', color, note, (i + 1) * 10]);
    added.accounts += 1;
  }

  const goal = await one('select id from goals where lower(name) = lower($1)', ['House extension']);
  if (!goal) {
    await query(
      `insert into goals (name, target_amount, target_date, color, note, sort_order)
            values ('House extension', 400000, null, '#C6862F', 'second floor, 54 sqm, with Kazie', 10)`,
    );
    added.goals += 1;
  }

  await ensureWindow(todayISO(), 3, 3);

  const totals = await one(`select
      (select count(*) from expenses where archived_at is null) as expenses,
      (select coalesce(sum(amount),0) from expenses where archived_at is null) as monthly_fixed,
      (select count(*) from accounts where archived_at is null) as accounts,
      (select count(*) from expense_payments) as payments`);

  console.log('added ', added);
  console.log('totals', totals);
} finally {
  await closePool();
}
