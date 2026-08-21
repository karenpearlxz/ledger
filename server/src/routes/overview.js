import express from 'express';
import { z } from 'zod';

import { many, one } from '../lib/db.js';
import { addMonths, compare, monthStart, todayISO } from '../lib/dates.js';
import { ensureWindow, getSetting, putSetting } from '../lib/finance.js';
import { getRate } from '../lib/fx.js';
import { badRequest, isoDate, route } from '../lib/http.js';
import { FREQUENCIES, monthlyFromPeriodic, paycheckSchedule, rateOn } from '../lib/payroll.js';
import { listOverrides, listRates } from './salary.js';

export const overviewRouter = express.Router();

const MONTH = /^\d{4}-\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const incomeBody = z.object({
  amountUsd: z.coerce.number().min(0).max(1_000_000).finite(),
  frequency: z.enum(FREQUENCIES),
  anchorPayday: z.string().regex(DATE),
});

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

overviewRouter.get('/fx', route(async (req, res) => {
  res.json(await getRate({ force: req.query.refresh === '1' }));
}));

overviewRouter.get('/income', route(async (_req, res) => {
  res.json({ income: await getSetting('income', { amountUsd: 0, frequency: 'biweekly', anchorPayday: todayISO() }) });
}));

overviewRouter.put('/income', route(async (req, res) => {
  const parsed = incomeBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  res.json({ income: await putSetting('income', parsed.data) });
}));

overviewRouter.get('/categories', route(async (_req, res) => {
  const rows = await many('select name, color, kind from categories order by kind, sort_order, lower(name)');
  res.json({ categories: rows });
}));

overviewRouter.post('/categories', route(async (req, res) => {
  const parsed = z.object({
    name: z.string().trim().min(1).max(40),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#A8B0AE'),
    kind: z.enum(['expense', 'income']).default('expense'),
  }).safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const b = parsed.data;
  const row = await one(
    `insert into categories (name, color, kind) values ($1,$2,$3)
     on conflict (name_lower) do update set color = excluded.color
     returning name, color, kind`,
    [b.name, b.color, b.kind],
  );
  res.status(201).json({ category: row });
}));

/**
 * Everything the home screen needs, in one round trip. The paycheck section is
 * the point of the app: which bills does each cheque actually have to cover.
 */
overviewRouter.get('/', route(async (req, res) => {
  const month = MONTH.test(String(req.query.month || '')) ? String(req.query.month) : todayISO().slice(0, 7);
  const period = `${month}-01`;
  const today = todayISO();

  await ensureWindow(period, 3, 3);

  const [income, fx, expenses, payments, accounts, goals, trend, salaryRates, overrideRows, spanPayments] = await Promise.all([
    getSetting('income', { amountUsd: 0, frequency: 'biweekly', anchorPayday: today }),
    getRate(),
    many('select * from expenses where archived_at is null order by sort_order, lower(name)'),
    many(
      // e.amount is the cost of ONE occurrence; p.amount is the monthly
      // equivalent. The edit sheet must round-trip the former, or a fortnightly
      // cost gets saved back as its own monthly total and grows every time.
      `select p.*, e.name, e.category, e.currency, e.due_day, e.start_date,
              e.is_recurring, e.frequency, e.amount as base_amount, e.end_date
         from expense_payments p join expenses e on e.id = p.expense_id
        where p.period = $1::date
        order by (e.due_day is null), p.due_date, lower(e.name)`,
      [period],
    ),
    many(`select a.*, b.amount as balance, b.as_of as balance_as_of
            from accounts a
            left join lateral (select amount, as_of from balances
                                where account_id = a.id order by as_of desc limit 1) b on true
           where a.archived_at is null order by a.sort_order, lower(a.name)`),
    many(`select g.*, coalesce(c.total, 0) as saved from goals g
            left join (select goal_id, sum(amount) as total from goal_contributions group by goal_id) c
              on c.goal_id = g.id
           where g.archived_at is null order by g.sort_order, lower(g.name)`),
    many(
      `select to_char(date_trunc('month', on_date), 'YYYY-MM') as month,
              sum(amount) filter (where kind = 'expense') as spent
         from transactions where on_date >= $1::date group by 1 order by 1`,
      [addMonths(period, -5)],
    ),
    listRates(),
    listOverrides(),
    // The paycheck cards reach up to two months past the month being viewed.
    // Scoring them against this month's rows alone made every cheque after the
    // current one look like it covered nothing.
    many(
      `select p.*, e.name, e.currency, e.due_day
         from expense_payments p join expenses e on e.id = p.expense_id
        where p.period >= $1::date and p.period < ($1::date + interval '3 months')
          and e.due_day is not null
        order by p.due_date`,
      [period],
    ),
  ]);

  const rate = fx.rate;
  const toPhp = (amount, currency) => (currency === 'USD' ? (rate ? amount * rate : null) : amount);

  const bills = payments.map((p) => {
    const due = isoDate(p.due_date);
    const spread = p.due_day === null;
    return {
      id: p.id,
      expenseId: p.expense_id,
      name: p.name,
      category: p.category,
      currency: p.currency,
      amount: Number(p.amount),
      amountPhp: round2(toPhp(Number(p.amount), p.currency)),
      dueDate: due,
      spread,
      paidOn: isoDate(p.paid_on),
      paidAmount: p.paid_amount === null ? null : Number(p.paid_amount),
      // The definition behind this month's figure. `amount` above is the
      // monthly equivalent; `baseAmount` is what one occurrence costs, which is
      // what the edit sheet must show and send back.
      frequency: p.frequency ?? 'monthly',
      baseAmount: p.base_amount === null || p.base_amount === undefined
        ? undefined : Number(p.base_amount),
      isRecurring: p.is_recurring,
      endDate: isoDate(p.end_date),
      // A bill cannot be late when it fell due before she started tracking it.
      // Adding a mid-month cost should not paint the month red.
      overdue: !p.paid_on && !spread && compare(due, today) < 0
        && compare(due, isoDate(p.start_date)) >= 0,
    };
  });

  const sum = (list) => round2(list.reduce((a, b) => a + (b.amountPhp || 0), 0));
  const monthlyFixed = sum(bills);
  const paidTotal = round2(bills.filter((b) => b.paidOn)
    .reduce((a, b) => a + (b.paidAmount ?? b.amountPhp ?? 0), 0));

  const perYear = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 }[income.frequency] || 26;
  const monthlyUsd = round2(monthlyFromPeriodic(income.amountUsd, income.frequency));
  const monthlyPhp = rate ? round2(monthlyUsd * rate) : null;

  const schedule = paycheckSchedule({
    anchorIso: income.anchorPayday, frequency: income.frequency, fromIso: today, count: 4,
  });

  // A spread cost has no due date, so it is charged evenly to every cheque
  // rather than dumped on whichever one happens to contain the 1st.
  const spreadMonthly = sum(bills.filter((b) => b.spread));
  const spreadPerCheque = round2(spreadMonthly * 12 / perYear);

  // Salary history, newest first, plus one-off overrides keyed by pay date.
  // An override is what she was ACTUALLY paid, so it wins over any rate.
  const rates = salaryRates.map((r) => ({
    effectiveFrom: isoDate(r.effective_from), amountUsd: Number(r.amount_usd), note: r.note,
  }));
  const overrides = new Map(overrideRows.map((r) => [isoDate(r.pay_date), {
    payDate: isoDate(r.pay_date), amount: Number(r.amount), currency: r.currency, note: r.note,
  }]));

  /**
   * What one cheque is worth. An override is what she was ACTUALLY paid and
   * wins over the rate. A peso override is taken at face value and never
   * re-converted: she already holds those pesos, so a moving exchange rate
   * must not rewrite history.
   */
  const valueCheque = (payDate) => {
    const active = rateOn(payDate, rates, income.amountUsd);
    const override = overrides.get(payDate) || null;
    let netUsd = active.amountUsd;
    let netPhp = rate ? round2(active.amountUsd * rate) : null;
    if (override) {
      if (override.currency === 'PHP') {
        netPhp = round2(override.amount);
        netUsd = rate ? round2(override.amount / rate) : null;
      } else {
        netUsd = round2(override.amount);
        netPhp = rate ? round2(override.amount * rate) : null;
      }
    }
    return { netUsd, netPhp, active, override };
  };

  // Dated bills across the whole span, so a cheque landing next month is
  // scored against next month's bills.
  const dated = spanPayments.map((r) => ({
    id: r.id,
    name: r.name,
    amountPhp: round2(toPhp(Number(r.amount), r.currency)),
    dueDate: isoDate(r.due_date),
    paidOn: isoDate(r.paid_on),
  }));
  const paychecks = schedule.map((p, i) => {
    const covered = dated.filter((b) => compare(b.dueDate, p.coversFrom) >= 0
      && (!p.coversTo || compare(b.dueDate, p.coversTo) < 0));
    const due = round2(covered.reduce((a, b) => a + (b.amountPhp || 0), 0) + spreadPerCheque);
    const { netUsd, netPhp, active, override } = valueCheque(p.payDate);

    return {
      index: i,
      payDate: p.payDate,
      coversFrom: p.coversFrom,
      coversTo: p.coversTo,
      amountUsd: netUsd,
      amountPhp: netPhp,
      rateEffectiveFrom: active.effectiveFrom,
      overridden: Boolean(override),
      override,
      billsDue: round2(due),
      spreadShare: spreadPerCheque,
      leftover: netPhp === null ? null : round2(netPhp - due),
      bills: covered.map((b) => ({ id: b.id, name: b.name, amountPhp: b.amountPhp, dueDate: b.dueDate, paidOn: b.paidOn })),
      isCurrent: compare(p.coversFrom, today) <= 0 && (!p.coversTo || compare(today, p.coversTo) < 0),
    };
  });

  // Paydays that actually land inside the month being viewed. The card strip
  // above counts forward from today, which says nothing about a month she has
  // navigated to, so the Bills page needs its own answer.
  const monthEnd = addMonths(period, 1);
  const monthPaychecks = paycheckSchedule({
    anchorIso: income.anchorPayday, frequency: income.frequency, fromIso: period, count: 8,
  })
    .filter((p) => compare(p.payDate, period) >= 0 && compare(p.payDate, monthEnd) < 0)
    .map((p) => {
      const { netUsd, netPhp, override } = valueCheque(p.payDate);
      return { payDate: p.payDate, amountUsd: netUsd, amountPhp: netPhp, overridden: Boolean(override) };
    });

  const monthIncome = monthPaychecks.every((p) => p.amountPhp === null)
    ? null
    : round2(monthPaychecks.reduce((a, p) => a + (p.amountPhp || 0), 0));

  const netWorth = round2(accounts.reduce((a, r) => {
    const value = r.balance === null ? 0 : Number(r.balance);
    return a + (r.currency === 'USD' ? (rate ? value * rate : 0) : value);
  }, 0));

  res.json({
    month,
    today,
    fx,
    income: { ...income, monthlyUsd, monthlyPhp, perYear },
    totals: {
      monthlyFixed,
      paid: paidTotal,
      unpaid: round2(monthlyFixed - paidTotal),
      overdueCount: bills.filter((b) => b.overdue).length,
      leftover: monthlyPhp === null ? null : round2(monthlyPhp - monthlyFixed),
      // Actual cheques landing in THIS month, which is not the same as the
      // averaged monthly figure: some months carry three paydays.
      monthIncome,
      monthLeft: monthIncome === null ? null : round2(monthIncome - monthlyFixed),
    },
    monthPaychecks,
    bills,
    paychecks,
    accounts: accounts.map((r) => ({
      id: r.id, name: r.name, kind: r.kind, currency: r.currency, color: r.color, note: r.note,
      balance: r.balance === null ? null : Number(r.balance),
      balanceAsOf: isoDate(r.balance_as_of),
      balancePhp: r.balance === null ? null : round2(toPhp(Number(r.balance), r.currency)),
    })),
    netWorth,
    goals: goals.map((g) => ({
      id: g.id, name: g.name, color: g.color, note: g.note,
      targetAmount: Number(g.target_amount), targetDate: isoDate(g.target_date),
      saved: Number(g.saved),
      percent: Math.min(100, round2(Number(g.saved) / Number(g.target_amount) * 100)),
    })),
    trend: trend.map((r) => ({ month: r.month, spent: Number(r.spent || 0) })),
    expenseCount: expenses.length,
  });
}));

export { monthStart };
