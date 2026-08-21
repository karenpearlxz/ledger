#!/usr/bin/env node
/**
 * Browser checks for salary history + paycheck overrides, against the LIVE site.
 *
 * Writes to the real database, so every fixture carries a per-run id and the
 * cleanup runs in `finally`, never at the end of the happy path. A killed run
 * must not leave a fake raise in Karen's ledger.
 */
import { chromium } from '/home/kit/node_modules/playwright/index.mjs';

const BASE = process.env.BASE || 'https://warily-vigilantly-factual-catbird.kitten.space';
const PASSCODE = process.env.LEDGER_PASSCODE || 'dandan2020';
const RUN = Math.random().toString(36).slice(2, 8);

// Far-future dates so fixtures can never collide with her real paydays.
const FIX_RATE_DATE = '2031-03-17';
const FIX_OV_DATE = '2031-04-21';

let pass = 0;
const failures = [];
const ok = (name, cond, detail = '') => {
  if (cond) { pass += 1; console.log(`  ok    ${name}`); }
  else { failures.push(`${name}${detail ? ` :: ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
};

const money = (s) => Number(String(s).replace(/[^0-9.]/g, '')) || 0;

async function main() {
  const browser = await chromium.launch();
  const cleanup = [];

  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage();

    // --- unlock -----------------------------------------------------------
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="password"]', PASSCODE);
    await page.press('input[type="password"]', 'Enter');
    await page.waitForSelector('nav[aria-label="Sections"]:visible', { timeout: 20000 });
    ok('1.1 unlocks', true);

    // Anything created through the API from here must be swept.
    const apiDelete = (path) => page.evaluate(
      (p) => fetch(p, { method: 'DELETE', credentials: 'same-origin' }).then((r) => r.status),
      path,
    );
    cleanup.push(() => apiDelete(`/api/salary/overrides/${FIX_OV_DATE}`));

    // --- her real numbers -------------------------------------------------
    const finance = await page.evaluate(() => fetch('/api/finance', { credentials: 'same-origin' }).then((r) => r.json()));
    const byDate = Object.fromEntries(finance.paychecks.map((p) => [p.payDate, p]));

    ok('2.1 Aug 14 cheque is the old rate',
      Math.round(byDate['2026-08-14']?.amountPhp) === 61015,
      `got ${byDate['2026-08-14']?.amountPhp}`);
    ok('2.2 Aug 28 cheque is the prorated amount',
      Math.round(byDate['2026-08-28']?.amountPhp) === 80295,
      `got ${byDate['2026-08-28']?.amountPhp}`);
    ok('2.3 Sept 11 cheque is the full new rate',
      byDate['2026-09-11']?.amountUsd === 1625,
      `got ${byDate['2026-09-11']?.amountUsd}`);
    ok('2.4 the three cheques are no longer all equal',
      new Set(finance.paychecks.map((p) => p.amountPhp)).size > 1);
    ok('2.5 adjusted cheques are flagged',
      byDate['2026-08-14']?.overridden === true && byDate['2026-09-11']?.overridden === false);

    // --- the flag is visible on the home cards ----------------------------
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('article.card', { timeout: 20000 });
    const cardText = await page.$$eval('article.card', (els) => els.map((e) => e.innerText));
    ok('3.1 an adjusted cheque says so on the card',
      cardText.some((t) => /adjusted/i.test(t)), cardText[0]?.slice(0, 80));
    ok('3.2 the unadjusted cheque does not',
      cardText.some((t) => !/adjusted/i.test(t)));

    const shownFirst = await page.$eval('article.card .font-display', (e) => e.textContent);
    ok('3.3 the card shows the adjusted peso amount', money(shownFirst) === 61015, shownFirst);

    // --- no layout regression on the phone --------------------------------
    const geo = await page.evaluate(() => ({
      vw: document.documentElement.clientWidth,
      scrollW: document.documentElement.scrollWidth,
    }));
    ok('3.4 no horizontal overflow at 390px', geo.scrollW <= geo.vw, JSON.stringify(geo));

    // --- settings UI ------------------------------------------------------
    await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Rate changes', { timeout: 20000 });
    ok('4.1 the rate changes section renders', true);
    ok('4.2 the adjustments section renders',
      await page.locator('text=Paycheck adjustments').first().isVisible());

    const settingsText = await page.innerText('body');
    ok('4.3 her recorded raise is listed', /\$1,625/.test(settingsText), settingsText.slice(0, 0));
    ok('4.4 her two adjustments are listed',
      /61,015/.test(settingsText) && /80,295/.test(settingsText));

    // --- add a rate through the UI ---------------------------------------
    cleanup.push(async () => {
      const rates = await page.evaluate(() => fetch('/api/salary', { credentials: 'same-origin' }).then((r) => r.json()));
      const mine = (rates.rates || []).filter((r) => r.effectiveFrom === FIX_RATE_DATE);
      for (const r of mine) await apiDelete(`/api/salary/rates/${r.id}`);
    });

    await page.click('button:has-text("Add a raise")');
    await page.fill('#r-from', FIX_RATE_DATE);
    await page.fill('#r-amt', '2222');
    await page.fill('#r-note', `check ${RUN}`);
    // Settings has more than one Save (the Income form has one too), so this
    // MUST be scoped to the rate form or it silently submits the wrong thing.
    await page.locator('form:has(#r-from) button[type="submit"]').click();
    await page.waitForSelector(`text=check ${RUN}`, { timeout: 20000 });
    ok('5.1 a rate change can be added from the UI', true);

    const afterAdd = await page.evaluate(() => fetch('/api/salary', { credentials: 'same-origin' }).then((r) => r.json()));
    ok('5.2 it persisted with the right amount',
      afterAdd.rates.some((r) => r.effectiveFrom === FIX_RATE_DATE && r.amountUsd === 2222));

    // A future rate must not disturb the cheques she can see today.
    const afterRate = await page.evaluate(() => fetch('/api/finance', { credentials: 'same-origin' }).then((r) => r.json()));
    ok('5.3 a future raise leaves current cheques alone',
      Math.round(afterRate.paychecks.find((p) => p.payDate === '2026-09-11')?.amountPhp)
      === Math.round(byDate['2026-09-11']?.amountPhp));

    // --- add an override through the UI -----------------------------------
    await page.click('button:has-text("Adjust one")');
    await page.fill('#o-date', FIX_OV_DATE);
    await page.fill('#o-amt', '12345');
    await page.selectOption('#o-cur', 'PHP');
    await page.fill('#o-note', `adj ${RUN}`);
    await page.locator('form:has(#o-date) button[type="submit"]').click();
    await page.waitForSelector(`text=adj ${RUN}`, { timeout: 20000 });
    ok('6.1 an adjustment can be added from the UI', true);

    const afterOv = await page.evaluate(() => fetch('/api/salary', { credentials: 'same-origin' }).then((r) => r.json()));
    const mineOv = afterOv.overrides.find((o) => o.payDate === FIX_OV_DATE);
    ok('6.2 it persisted in pesos', mineOv?.amount === 12345 && mineOv?.currency === 'PHP');

    // --- a peso override must not move when FX moves ----------------------
    const before = mineOv.amount;
    await page.evaluate(() => fetch('/api/finance/fx?refresh=1', { credentials: 'same-origin' }));
    const reread = await page.evaluate(() => fetch('/api/salary', { credentials: 'same-origin' }).then((r) => r.json()));
    ok('6.3 a peso amount does not drift with the exchange rate',
      reread.overrides.find((o) => o.payDate === FIX_OV_DATE)?.amount === before);

    // --- delete through the UI --------------------------------------------
    const row = page.locator('li', { hasText: `adj ${RUN}` }).first();
    await row.locator('button:has-text("Remove")').click();
    await row.locator('button:has-text("Sure?")').click();
    await page.waitForSelector(`text=adj ${RUN}`, { state: 'detached', timeout: 20000 });
    ok('7.1 an adjustment can be removed', true);

    const gone = await page.evaluate(() => fetch('/api/salary', { credentials: 'same-origin' }).then((r) => r.json()));
    ok('7.2 the removal persisted', !gone.overrides.some((o) => o.payDate === FIX_OV_DATE));

    // --- desktop ----------------------------------------------------------
    const wide = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const dp = await wide.newPage();
    await dp.goto(BASE, { waitUntil: 'domcontentloaded' });
    await dp.fill('input[type="password"]', PASSCODE);
    await dp.press('input[type="password"]', 'Enter');
    await dp.waitForSelector('nav[aria-label="Sections"]:visible', { timeout: 20000 });
    await dp.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' });
    await dp.waitForSelector('text=Rate changes', { timeout: 20000 });
    const dgeo = await dp.evaluate(() => ({
      vw: document.documentElement.clientWidth,
      scrollW: document.documentElement.scrollWidth,
    }));
    ok('8.1 settings does not overflow at 1280px', dgeo.scrollW <= dgeo.vw, JSON.stringify(dgeo));
    await dp.screenshot({ path: '/home/kit/ledger/shots/salary-desktop.png', fullPage: true });
    await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Rate changes', { timeout: 20000 });
    await page.screenshot({ path: '/home/kit/ledger/shots/salary-phone.png', fullPage: true });
    await wide.close();
  } finally {
    // Sweep no matter how we got here.
    for (const fn of cleanup.reverse()) {
      try { await fn(); } catch (err) { console.log(`  cleanup warning: ${err.message}`); }
    }
    await browser.close();
  }

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) { console.log(`failed: ${failures.join(', ')}`); process.exit(1); }
}

main().catch((err) => { console.error(err); process.exit(1); });
