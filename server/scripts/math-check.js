#!/usr/bin/env node
/** Pure date/payroll maths. No network, no database. */
import assert from 'node:assert/strict';

import { addDays, addMonths, daysInMonth, diffDays, dueDateFor, monthStart, todayISO } from '../src/lib/dates.js';
import { monthlyFromPeriodic, nextPayday, paycheckSchedule } from '../src/lib/payroll.js';
import { monthlyEquivalent } from '../src/lib/finance.js';

let pass = 0; let fail = 0;
const t = (name, fn) => {
  try { fn(); pass += 1; console.log(`  ok    ${name}`); }
  catch (err) { fail += 1; console.log(`  FAIL  ${name}\n        ${err.message}`); }
};

t('addDays crosses a month boundary', () => assert.equal(addDays('2026-01-31', 1), '2026-02-01'));
t('addDays crosses a year boundary', () => assert.equal(addDays('2026-12-31', 1), '2027-01-01'));
t('addDays goes backwards', () => assert.equal(addDays('2026-03-01', -1), '2026-02-28'));
t('leap day exists in 2028', () => assert.equal(addDays('2028-02-28', 1), '2028-02-29'));
t('diffDays is inclusive of direction', () => assert.equal(diffDays('2026-08-21', '2026-09-04'), 14));
t('diffDays is negative backwards', () => assert.equal(diffDays('2026-09-04', '2026-08-21'), -14));
t('daysInMonth february 2026', () => assert.equal(daysInMonth(2026, 2), 28));
t('daysInMonth february 2028', () => assert.equal(daysInMonth(2028, 2), 29));
t('monthStart truncates', () => assert.equal(monthStart('2026-08-21'), '2026-08-01'));
t('addMonths wraps the year', () => assert.equal(addMonths('2026-12-01', 1), '2027-01-01'));
t('addMonths goes backwards over a year', () => assert.equal(addMonths('2026-01-01', -1), '2025-12-01'));

t('due day 31 clamps to february', () => assert.equal(dueDateFor('2026-02-01', 31), '2026-02-28'));
t('due day 31 clamps to april', () => assert.equal(dueDateFor('2026-04-01', 31), '2026-04-30'));
t('due day 31 survives january', () => assert.equal(dueDateFor('2026-01-01', 31), '2026-01-31'));
t('due day 7 is the 7th', () => assert.equal(dueDateFor('2026-08-01', 7), '2026-08-07'));
t('spread bills have no due date', () => assert.equal(dueDateFor('2026-08-01', null), null));

t('biweekly next payday is 14 days', () =>
  assert.equal(nextPayday('2026-08-28', '2026-08-28', 'biweekly'), '2026-09-11'));

t('biweekly schedule starts before the anchor', () => {
  const s = paycheckSchedule({ anchorIso: '2026-08-28', frequency: 'biweekly', fromIso: '2026-08-21', count: 3 });
  assert.deepEqual(s.map((p) => p.payDate), ['2026-08-14', '2026-08-28', '2026-09-11']);
});

t('biweekly windows are contiguous and 14 days wide', () => {
  const s = paycheckSchedule({ anchorIso: '2026-08-28', frequency: 'biweekly', fromIso: '2026-08-28', count: 4 });
  for (let i = 0; i < s.length - 1; i += 1) {
    assert.equal(s[i].coversTo, s[i + 1].coversFrom, 'no gap between paychecks');
    assert.equal(diffDays(s[i].coversFrom, s[i].coversTo), 14);
  }
});

t('a bill on the payday belongs to that paycheck', () => {
  const [p] = paycheckSchedule({ anchorIso: '2026-08-28', frequency: 'biweekly', fromIso: '2026-08-28', count: 1 });
  assert.equal(p.coversFrom, '2026-08-28');
  assert.ok(p.coversTo > '2026-08-28');
});

t('weekly steps 7 days', () => {
  const s = paycheckSchedule({ anchorIso: '2026-08-28', frequency: 'weekly', fromIso: '2026-08-28', count: 2 });
  assert.deepEqual(s.map((p) => p.payDate), ['2026-08-28', '2026-09-04']);
});

t('monthly anchored on the 31st clamps every short month', () => {
  const s = paycheckSchedule({ anchorIso: '2026-01-31', frequency: 'monthly', fromIso: '2026-01-31', count: 4 });
  assert.deepEqual(s.map((p) => p.payDate), ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
});

t('semimonthly is the 15th and the last day', () => {
  const s = paycheckSchedule({ anchorIso: '2026-02-15', frequency: 'semimonthly', fromIso: '2026-02-15', count: 4 });
  assert.deepEqual(s.map((p) => p.payDate), ['2026-02-15', '2026-02-28', '2026-03-15', '2026-03-31']);
});

t('unknown frequency yields nothing rather than guessing', () =>
  assert.deepEqual(paycheckSchedule({ anchorIso: '2026-08-28', frequency: 'fortnightly', fromIso: '2026-08-28' }), []));

t('biweekly monthly income is not amount x 2', () => {
  // 1625 * 26 / 12 = 3520.8333..., NOT 3250. Getting this wrong understates
  // her income by ~$271 a month.
  assert.equal(Math.round(monthlyFromPeriodic(1625, 'biweekly') * 100) / 100, 3520.83);
});
t('semimonthly monthly income is amount x 2', () => assert.equal(monthlyFromPeriodic(1625, 'semimonthly'), 3250));
t('weekly monthly income', () =>
  assert.equal(Math.round(monthlyFromPeriodic(1000, 'weekly') * 100) / 100, 4333.33));
t('monthly is itself', () => assert.equal(monthlyFromPeriodic(3000, 'monthly'), 3000));

t('todayISO returns a calendar date in Manila', () => assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/));
t('Manila is a day ahead of UTC late in the evening', () => {
  const instant = new Date('2026-08-21T16:30:00Z');
  assert.equal(todayISO('Asia/Manila', instant), '2026-08-22');
  assert.equal(todayISO('UTC', instant), '2026-08-21');
});

// ------------------------------------------------------------- frequency
// `amount` is one occurrence. Treating a fortnightly cost as monthly hides a
// whole extra payment a year, which is the entire reason the field exists.
t('biweekly 2250 is 4875 a month', () => assert.equal(monthlyEquivalent(2250, 'biweekly'), 4875));
t('weekly 1000 is 4333.33 a month', () => assert.equal(monthlyEquivalent(1000, 'weekly'), 4333.33));
t('monthly is left alone', () => assert.equal(monthlyEquivalent(4500, 'monthly'), 4500));
t('quarterly lands whole, not averaged', () => assert.equal(monthlyEquivalent(3000, 'quarterly'), 3000));
t('yearly lands whole, not averaged', () => assert.equal(monthlyEquivalent(12000, 'yearly'), 12000));
t('a year of fortnightly is 26 payments, not 24', () =>
  assert.ok(Math.abs(monthlyEquivalent(2250, 'biweekly') * 12 - 2250 * 26) < 0.01));
t('a year of weekly is 52 payments', () =>
  assert.ok(Math.abs(monthlyEquivalent(1000, 'weekly') * 12 - 1000 * 52) < 0.5));
t('4875 a month is 2250 a cheque', () =>
  assert.equal(Math.round((4875 * 12 / 26) * 100) / 100, 2250));
t('a zero amount stays zero', () => assert.equal(monthlyEquivalent(0, 'weekly'), 0));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
