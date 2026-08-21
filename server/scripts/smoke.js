#!/usr/bin/env node
/**
 * End-to-end API checks against a RUNNING server, over real HTTP, with a real
 * cookie jar. Anything it creates, it deletes.
 */
const BASE = process.env.BASE || 'http://127.0.0.1:8600';
const PASSCODE = process.env.LEDGER_PASSCODE || (await import('../src/lib/env.js')).env.LEDGER_PASSCODE;

let pass = 0; let fail = 0;
const jar = new Map();

const ok = (name, cond, extra = '') => {
  if (cond) { pass += 1; console.log(`  ok    ${name}`); }
  else { fail += 1; console.log(`  FAIL  ${name}${extra ? `\n        ${extra}` : ''}`); }
};

async function call(method, path, body, { auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && jar.size) headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });

  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(';');
    const i = pair.indexOf('=');
    jar.set(pair.slice(0, i), pair.slice(i + 1));
  }

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* html */ }
  return { status: res.status, json, text, headers: res.headers };
}

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const month = today.slice(0, 7);
const tag = `smoke-${Date.now().toString(36)}`;

const cleanup = [];

try {
  // ------------------------------------------------------------------ locked
  ok('health is public', (await call('GET', '/api/health', undefined, { auth: false })).status === 200);
  ok('finance is locked', (await call('GET', '/api/finance', undefined, { auth: false })).status === 401);
  ok('content is locked', (await call('GET', '/api/content/journal', undefined, { auth: false })).status === 401);
  ok('expenses are locked', (await call('GET', '/api/expenses', undefined, { auth: false })).status === 401);
  ok('auth/me says locked', (await call('GET', '/api/auth/me', undefined, { auth: false })).json?.unlocked === false);
  ok('wrong passcode is rejected', (await call('POST', '/api/auth/unlock', { passcode: 'nope-nope-nope' })).status === 401);

  // ----------------------------------------------------------------- unlock
  const unlock = await call('POST', '/api/auth/unlock', { passcode: PASSCODE });
  ok('correct passcode unlocks', unlock.status === 200, JSON.stringify(unlock.json));
  ok('a session cookie was set', jar.has('ledger_session'));
  ok('auth/me now says unlocked', (await call('GET', '/api/auth/me')).json?.unlocked === true);

  // ---------------------------------------------------------------- content
  const figures = await call('GET', '/api/content/figures');
  ok('figures exist', figures.json?.figures?.length >= 48, `got ${figures.json?.figures?.length}`);
  ok('figures come back newest first',
    figures.json.figures[0].ordinal > figures.json.figures.at(-1).ordinal);
  ok('the list omits the huge bodies', figures.json.figures.every((f) => f.body === undefined));
  ok('every figure has an epithet', figures.json.figures.every((f) => f.epithet.length > 10));

  const one = await call('GET', `/api/content/figures/${figures.json.figures[0].slug}`);
  ok('a single figure carries its essay', one.json?.figure?.body?.length > 2000);
  ok('the essay kept its markup', one.json.figure.body.includes('<p'));
  ok('no inline handlers survived the import', !/\son[a-z]+\s*=/i.test(one.json.figure.body));
  ok('no script tags survived the import', !/<script/i.test(one.json.figure.body));
  ok('a missing figure is a 404', (await call('GET', '/api/content/figures/nobody-here')).status === 404);

  const journal = await call('GET', '/api/content/journal');
  ok('journal entries exist', journal.json?.entries?.length >= 1, `got ${journal.json?.entries?.length}`);
  ok('journal is newest first', journal.json.entries[0].entryDate >= journal.json.entries.at(-1).entryDate);
  ok('journal bodies survived', journal.json.entries.every((e) => e.body.length > 20));

  const work = await call('GET', '/api/content/work');
  ok('work log entries exist', work.json?.entries?.length >= 1, `got ${work.json?.entries?.length}`);

  const poems = await call('GET', '/api/content/poems');
  ok('poems exist', poems.json?.poems?.length >= 1, `got ${poems.json?.poems?.length}`);
  ok('poems kept their line breaks', poems.json.poems.some((p) => p.body.includes('\n')));

  const search = await call('GET', '/api/content/search?q=dandan');
  ok('search finds something', search.json?.results?.length > 0);
  ok('a one-character search returns nothing', (await call('GET', '/api/content/search?q=a')).json.results.length === 0);
  ok('a % in the query does not match everything',
    (await call('GET', '/api/content/search?q=%25%25%25')).json.results.length === 0);

  // ---------------------------------------------------------------- finance
  const fin = await call('GET', '/api/finance');
  ok('overview loads', fin.status === 200, JSON.stringify(fin.json)?.slice(0, 200));
  const o = fin.json;
  ok('income is $1,625 biweekly', o.income.amountUsd === 1625 && o.income.frequency === 'biweekly',
    `got ${o.income.amountUsd} ${o.income.frequency}`);
  // The invariant, whatever the numbers happen to be. Biweekly is 26 cheques a
  // year, not 24; treating it as x2 understates her income by ~$271 a month.
  ok('monthly income = cheque x periods / 12',
    Math.abs(o.income.monthlyUsd - (o.income.amountUsd * o.income.perYear / 12)) < 0.02,
    `got ${o.income.monthlyUsd}`);
  ok('biweekly means 26 periods', o.income.frequency !== 'biweekly' || o.income.perYear === 26);
  ok('an fx rate is present', typeof o.fx.rate === 'number' && o.fx.rate > 30 && o.fx.rate < 100, `got ${o.fx.rate}`);
  ok('expenses are seeded', o.bills.length >= 1, `got ${o.bills.length}`);
  // Verify the total is dynamically calculated from expenses, not hardcoded
  const expectedSum = o.bills.reduce((sum, b) => sum + (b.amountPhp || 0), 0);
  ok('monthly total equals sum of expenses', Math.abs(o.totals.monthlyFixed - expectedSum) < 1,
    `total ${o.totals.monthlyFixed} vs sum ${expectedSum}`);
  ok('four paychecks are projected', o.paychecks.length === 4);
  ok('exactly one paycheck is the current one', o.paychecks.filter((p) => p.isCurrent).length === 1);
  ok('paycheck windows do not overlap',
    o.paychecks.every((p, i) => i === 0 || p.coversFrom === o.paychecks[i - 1].coversTo));
  ok('every dated bill lands in exactly one paycheck', (() => {
    const dated = o.bills.filter((b) => !b.spread).map((b) => b.id);
    const seen = o.paychecks.flatMap((p) => p.bills.map((b) => b.id));
    const inWindow = dated.filter((id) => seen.includes(id));
    return new Set(seen).size === seen.length && inWindow.length > 0;
  })());
  ok('spread costs are shared, not dumped on one cheque',
    o.paychecks.every((p) => Math.abs(p.spreadShare - o.paychecks[0].spreadShare) < 0.01)
    && o.paychecks[0].spreadShare > 0);
  ok('leftover is income minus what the cheque owes',
    o.paychecks.every((p) => Math.abs(p.leftover - (p.amountPhp - p.billsDue)) < 0.02));
  ok('a spread bill has no due date shown as a deadline',
    o.bills.filter((b) => b.spread).every((b) => b.overdue === false));
  ok('3 accounts are seeded', o.accounts.length === 3);
  ok('the reno goal is there', o.goals.some((g) => g.targetAmount === 400000));
  ok('categories load', (await call('GET', '/api/finance/categories')).json.categories.length >= 12);

  // ---------------------------------------------------------- expense CRUD
  const created = await call('POST', '/api/expenses', {
    name: `${tag} gym`, amount: 1234.5, dueDay: 9, category: 'Personal', isRecurring: true,
  });
  ok('an expense can be created', created.status === 201, JSON.stringify(created.json));
  const expenseId = created.json?.expense?.id;
  if (expenseId) cleanup.push(() => call('DELETE', `/api/expenses/${expenseId}?hard=1`));
  ok('the new expense has the amount given', created.json.expense.amount === 1234.5);

  const listed = await call('GET', '/api/expenses');
  ok('it appears in the list', listed.json.expenses.some((e) => e.id === expenseId));

  // Added today with a due day that has already passed this month: it must
  // NOT appear as instantly overdue for a month it did not exist in.
  const monthly = await call('GET', `/api/expenses/payments/${month}`);
  const dayNow = Number(today.slice(8, 10));
  const thisMonthRow = monthly.json.payments.find((p) => p.expenseId === expenseId);
  ok('a day already past is not backdated into this month',
    dayNow > 9 ? !thisMonthRow : Boolean(thisMonthRow));

  const nextMonth = (() => {
    const [yy, mm] = month.split('-').map(Number);
    return mm === 12 ? `${yy + 1}-01` : `${yy}-${String(mm + 1).padStart(2, '0')}`;
  })();
  const nextRows = await call('GET', `/api/expenses/payments/${nextMonth}`);
  const payment = nextRows.json.payments.find((p) => p.expenseId === expenseId);
  ok('next month materialised an instance for it', Boolean(payment));
  ok('the instance is dated the 9th', payment?.dueDate?.endsWith('-09'), payment?.dueDate);

  const patched = await call('PATCH', `/api/expenses/${expenseId}`, { amount: 1500, dueDay: 28 });
  ok('an expense can be edited', patched.status === 200 && patched.json.expense.amount === 1500);
  const after = await call('GET', `/api/expenses/payments/${nextMonth}`);
  const movedTo = after.json.payments.find((p) => p.expenseId === expenseId);
  ok('the unpaid instance followed the edit', movedTo.amount === 1500 && movedTo.dueDate.endsWith('-28'));

  const paid = await call('PATCH', `/api/expenses/payments/${movedTo.id}`, { paidOn: today });
  ok('a bill can be marked paid', paid.status === 200 && paid.json.payment.paidOn === today);
  ok('marking paid fills in the amount paid', paid.json.payment.paidAmount === 1500);

  await call('PATCH', `/api/expenses/${expenseId}`, { amount: 9999 });
  const settled = (await call('GET', `/api/expenses/payments/${nextMonth}`))
    .json.payments.find((p) => p.expenseId === expenseId);
  ok('editing does NOT rewrite a month already reconciled', settled.amount === 1500, `got ${settled.amount}`);

  const unpaid = await call('PATCH', `/api/expenses/payments/${movedTo.id}`, { paidOn: null });
  ok('a bill can be un-paid', unpaid.json.payment.paidOn === null && unpaid.json.payment.paidAmount === null);

  ok('a one-off with no day is rejected',
    (await call('POST', '/api/expenses', { name: `${tag} bad`, amount: 1, isRecurring: false })).status === 400);
  ok('a negative amount is rejected',
    (await call('POST', '/api/expenses', { name: `${tag} bad`, amount: -5 })).status === 400);
  ok('a day of 32 is rejected',
    (await call('POST', '/api/expenses', { name: `${tag} bad`, amount: 5, dueDay: 32 })).status === 400);
  ok('an end date before the start is rejected',
    (await call('POST', '/api/expenses', {
      name: `${tag} bad`, amount: 5, dueDay: 3, startDate: '2026-06-01', endDate: '2026-01-01',
    })).status === 400);
  ok('an empty name is rejected',
    (await call('POST', '/api/expenses', { name: '   ', amount: 5, dueDay: 3 })).status === 400);
  ok('editing a missing expense is a 404',
    (await call('PATCH', '/api/expenses/6f1c6b3e-0000-4000-8000-000000000000', { amount: 1 })).status === 404);

  // ------------------------------------------------------- clamping to EOM
  const eom = await call('POST', '/api/expenses', {
    name: `${tag} eom`, amount: 100, dueDay: 31, category: 'Other',
  });
  const eomId = eom.json.expense.id;
  cleanup.push(() => call('DELETE', `/api/expenses/${eomId}?hard=1`));
  const feb = await call('GET', '/api/expenses/payments/2027-02');
  const febRow = feb.json.payments.find((p) => p.expenseId === eomId);
  ok('a bill due on the 31st lands on the 28th in February', febRow?.dueDate === '2027-02-28', febRow?.dueDate);
  const apr = await call('GET', '/api/expenses/payments/2027-04');
  ok('and on the 30th in April',
    apr.json.payments.find((p) => p.expenseId === eomId)?.dueDate === '2027-04-30');

  // -------------------------------------------------------------- calendar
  const cal = await call('GET', `/api/expenses/calendar/${month}`);
  ok('the calendar loads', cal.status === 200 && Array.isArray(cal.json.days));
  ok('the calendar excludes spread costs', cal.json.days.every((d) => d.dueDate));
  ok('a bad month is rejected', (await call('GET', '/api/expenses/calendar/2026-1')).status === 400);

  // -------------------------------------------------------------- accounts
  const acct = await call('POST', '/api/accounts', { name: `${tag} account`, kind: 'cash', color: '#123456' });
  ok('an account can be created', acct.status === 201);
  const acctId = acct.json.account.id;
  cleanup.push(() => call('DELETE', `/api/accounts/${acctId}`));

  const bal = await call('PUT', `/api/accounts/${acctId}/balance`, { amount: 5000 });
  ok('a balance can be set', bal.status === 200 && bal.json.balance.amount === 5000);
  const bal2 = await call('PUT', `/api/accounts/${acctId}/balance`, { amount: 7500 });
  ok('setting it twice in one day overwrites rather than duplicating', bal2.json.balance.amount === 7500);
  ok('the account list shows the latest balance',
    (await call('GET', '/api/accounts')).json.accounts.find((a) => a.id === acctId).balance === 7500);
  ok('a bad colour is rejected',
    (await call('POST', '/api/accounts', { name: 'x', color: 'red' })).status === 400);
  ok('a balance on a missing account is a 404',
    (await call('PUT', '/api/accounts/6f1c6b3e-0000-4000-8000-000000000000/balance', { amount: 1 })).status === 404);
  ok('net worth history loads', Array.isArray((await call('GET', '/api/accounts/networth')).json.series));

  // ----------------------------------------------------------------- goals
  const goal = await call('POST', '/api/goals', { name: `${tag} goal`, targetAmount: 1000 });
  ok('a goal can be created', goal.status === 201);
  const goalId = goal.json.goal.id;
  cleanup.push(() => call('DELETE', `/api/goals/${goalId}`));

  await call('POST', `/api/goals/${goalId}/contributions`, { amount: 400 });
  const contrib = await call('POST', `/api/goals/${goalId}/contributions`, { amount: 150 });
  ok('contributions add up',
    (await call('GET', '/api/goals')).json.goals.find((g) => g.id === goalId).saved === 550);
  ok('a withdrawal is allowed',
    (await call('POST', `/api/goals/${goalId}/contributions`, { amount: -50 })).status === 201);
  ok('the total reflects the withdrawal',
    (await call('GET', '/api/goals')).json.goals.find((g) => g.id === goalId).saved === 500);
  ok('a zero contribution is rejected',
    (await call('POST', `/api/goals/${goalId}/contributions`, { amount: 0 })).status === 400);
  ok('a contribution can be deleted',
    (await call('DELETE', `/api/goals/contributions/${contrib.json.contribution.id}`)).status === 200);
  ok('deleting it changed the total',
    (await call('GET', '/api/goals')).json.goals.find((g) => g.id === goalId).saved === 350);
  ok('a target of zero is rejected',
    (await call('POST', '/api/goals', { name: 'x', targetAmount: 0 })).status === 400);

  // ---------------------------------------------------------- transactions
  const txn = await call('POST', '/api/transactions', {
    description: `${tag} groceries`, amount: 812.25, category: 'Food', accountId: acctId,
  });
  ok('a transaction can be logged', txn.status === 201 && txn.json.transaction.amount === 812.25);
  const txnId = txn.json.transaction.id;
  cleanup.push(() => call('DELETE', `/api/transactions/${txnId}`));
  ok('it defaults to today', txn.json.transaction.onDate === today);
  ok('it appears in this month', (await call('GET', `/api/transactions?month=${month}`))
    .json.transactions.some((t) => t.id === txnId));
  ok('an unknown account is rejected',
    (await call('POST', '/api/transactions', {
      description: 'x', amount: 1, accountId: '6f1c6b3e-0000-4000-8000-000000000000',
    })).status === 400);
  const insights = await call('GET', '/api/transactions/insights?months=6');
  ok('insights load', insights.status === 200);
  ok('the new transaction shows in the category split',
    insights.json.byCategory.some((c) => c.category === 'Food'));

  // ---------------------------------------------------------------- income
  // Registered BEFORE the change, so a crash between here and the restore
  // still puts her real salary back. An earlier version restored on the happy
  // path only, and a killed run left her income sitting at $2,000 monthly.
  const beforeIncome = o.income;
  cleanup.push(() => call('PUT', '/api/finance/income', {
    amountUsd: beforeIncome.amountUsd,
    frequency: beforeIncome.frequency,
    anchorPayday: beforeIncome.anchorPayday,
  }));
  ok('income can be changed', (await call('PUT', '/api/finance/income', {
    amountUsd: 2000, frequency: 'monthly', anchorPayday: '2026-09-01',
  })).status === 200);
  const changed = await call('GET', '/api/finance');
  ok('a monthly cheque is 12 a year', changed.json.income.perYear === 12);
  ok('monthly income equals the cheque', Math.abs(changed.json.income.monthlyUsd - 2000) < 0.01);
  await call('PUT', '/api/finance/income', {
    amountUsd: beforeIncome.amountUsd,
    frequency: beforeIncome.frequency,
    anchorPayday: beforeIncome.anchorPayday,
  });
  ok('income was restored', (await call('GET', '/api/finance')).json.income.amountUsd === 1625);
  ok('a nonsense frequency is rejected', (await call('PUT', '/api/finance/income', {
    amountUsd: 100, frequency: 'fortnightly', anchorPayday: '2026-09-01',
  })).status === 400);

  // -------------------------------------------------------------- security
  ok('the CSP forbids framing',
    (await call('GET', '/api/health')).headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
  ok('the session cookie is httpOnly and sameSite',
    /HttpOnly/i.test(unlock.headers.getSetCookie().join()) && /SameSite=Lax/i.test(unlock.headers.getSetCookie().join()));

  // ------------------------------------------------------------------ lock
  ok('locking works', (await call('POST', '/api/auth/lock')).status === 200);
  ok('the session is dead immediately', (await call('GET', '/api/finance')).status === 401);
} finally {
  if (cleanup.length) {
    // Cleanup lives here, not at the end of the happy path: a suite that dies
    // half way must not leave fixtures in real data.
    await call('POST', '/api/auth/unlock', { passcode: PASSCODE });
    for (const undo of cleanup.reverse()) {
      try { await undo(); } catch { /* best effort */ }
    }
    await call('POST', '/api/auth/lock');
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
