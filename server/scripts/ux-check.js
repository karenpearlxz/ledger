#!/usr/bin/env node
/**
 * Browser checks for the round of UX fixes: paycheck card spacing, a scrollable
 * edit sheet, optimistic paid-ticking, tab-switch caching, and the rebuilt
 * Bills summary.
 *
 * Runs against the LIVE site and therefore the real database. Every fixture
 * carries a per-run id and cleanup happens in `finally`.
 */
import { chromium } from '/home/kit/node_modules/playwright/index.mjs';

const BASE = process.env.BASE || 'https://warily-vigilantly-factual-catbird.kitten.space';
const PASSCODE = process.env.LEDGER_PASSCODE || 'dandan2020';
const RUN = Math.random().toString(36).slice(2, 8);
const FIXTURE = `ux ${RUN} probe`;

let pass = 0;
const failures = [];
const ok = (name, cond, detail = '') => {
  if (cond) { pass += 1; console.log(`  ok    ${name}`); }
  else { failures.push(name); console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
};

async function main() {
  const browser = await chromium.launch();
  const cleanup = [];

  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage();

    // A handler that throws produces NO network request and NO visible change,
    // which reads in a test as "the feature is slow". `setData is not defined`
    // shipped and broke ticking a bill entirely. Any uncaught error now fails
    // the run on its own.
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`console: ${m.text()}`); });

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="password"]', PASSCODE);
    await page.press('input[type="password"]', 'Enter');
    await page.waitForSelector('nav[aria-label="Sections"]:visible', { timeout: 20000 });
    ok('1.1 unlocks', true);

    // ---- 2. paycheck card spacing ---------------------------------------
    await page.waitForSelector('article.card', { timeout: 20000 });
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
    const gap = await page.$eval('article.card', (card) => {
      const chip = card.querySelector('.chip');
      const date = chip?.parentElement?.lastElementChild;
      if (!chip || !date || chip === date) return null;
      const a = chip.getBoundingClientRect();
      const b = date.getBoundingClientRect();
      return { gap: Math.round(b.left - a.right), chip: chip.innerText.trim(), date: date.innerText.trim() };
    });
    ok('2.1 chip and date are actually separated', gap && gap.gap >= 12, JSON.stringify(gap));
    ok('2.2 the date is on one line', gap && !/\n/.test(gap.date), JSON.stringify(gap));

    // ---- 3. Bills summary ------------------------------------------------
    await page.click('nav[aria-label="Sections"]:visible a[href="/bills"]');
    await page.waitForSelector('text=left after bills', { timeout: 20000 });
    const summary = (await page.innerText('body')).toLowerCase();
    ok('3.1 the summary leads with what is left', /left after bills|short this month/.test(summary));
    ok('3.2 it shows money coming in', summary.includes('coming in'));
    ok('3.3 it no longer shows the redundant pair',
      !summary.includes('still to pay') || !summary.includes('month total'));

    const figures = await page.evaluate(() => {
      const t = document.body.innerText;
      const grab = (label) => {
        const i = t.toLowerCase().indexOf(label);
        return i === -1 ? null : t.slice(i, i + 60);
      };
      return { incoming: grab('coming in'), bills: grab('bills\n') };
    });
    ok('3.4 the income figure is populated',
      figures.incoming && /[0-9]/.test(figures.incoming) && !figures.incoming.includes('—'),
      JSON.stringify(figures));

    // API cross-check: the summary must equal income minus bills.
    const fin = await page.evaluate(() => fetch('/api/finance', { credentials: 'same-origin' }).then((r) => r.json()));
    ok('3.5 left equals income minus bills',
      Math.abs((fin.totals.monthIncome - fin.totals.monthlyFixed) - fin.totals.monthLeft) < 0.01,
      JSON.stringify(fin.totals));
    ok('3.6 month income is the sum of that month\'s cheques',
      Math.abs(fin.monthPaychecks.reduce((a, p) => a + p.amountPhp, 0) - fin.totals.monthIncome) < 0.01);

    // ---- 4. a fixture bill to tick safely --------------------------------
    const created = await page.evaluate(async (name) => {
      const r = await fetch('/api/expenses', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount: 11, currency: 'PHP', dueDay: 28, category: 'Other', isRecurring: true }),
      });
      return r.json();
    }, FIXTURE);
    const expenseId = created?.expense?.id;
    ok('4.1 fixture bill created', Boolean(expenseId));
    cleanup.push(() => page.evaluate(
      (id) => fetch(`/api/expenses/${id}`, { method: 'DELETE', credentials: 'same-origin' }).then((r) => r.status),
      expenseId,
    ));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`text=${FIXTURE}`, { timeout: 20000 });

    // ---- 5. optimistic tick ----------------------------------------------
    // Hold the PATCH open. If the UI is optimistic it moves anyway.
    await page.route('**/api/expenses/payments/**', async (r) => {
      await new Promise((res) => setTimeout(res, 2500));
      await r.continue();
    });

    const row = page.locator('li', { hasText: FIXTURE }).first();
    const tick = row.locator('button[aria-pressed]').first();
    // aria-pressed is the actual state. Matching the word "paid" in innerHTML
    // hit the button's own aria-label ("Mark X paid") and passed regardless of
    // whether anything happened at all.
    const pressed = () => tick.getAttribute('aria-pressed');
    ok('5.0 the fixture starts unpaid', (await pressed()) === 'false');

    const t0 = Date.now();
    const settled = page.waitForResponse((r) => r.url().includes('/api/expenses/payments/'));
    await tick.click();
    let flipped = false;
    for (let i = 0; i < 40; i += 1) {
      if ((await pressed()) === 'true') { flipped = true; break; }
      await page.waitForTimeout(25);
    }
    const elapsed = Date.now() - t0;
    ok('5.1 the row flips before the server answers', flipped && elapsed < 1500, `${elapsed}ms`);

    // Let the held request finish BEFORE unrouting; unrouting mid-flight can
    // abort it, which looked like "the tick never persisted".
    await settled;
    await page.unroute('**/api/expenses/payments/**');
    await page.waitForTimeout(500);

    const persisted = await page.evaluate((name) => fetch('/api/finance', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => d.bills.find((b) => b.name === name)?.paidOn), FIXTURE);
    ok('5.2 the tick actually persisted', Boolean(persisted), String(persisted));

    // Revert failure path: make the server reject and confirm the UI goes back.
    await page.route('**/api/expenses/payments/**', (r) => r.fulfill({
      status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'nope' }),
    }));
    await tick.click();
    await page.waitForTimeout(1500);
    ok('5.3 a failed tick is put back', (await pressed()) === 'true',
      'it should snap back to paid after the server refuses');
    await page.unroute('**/api/expenses/payments/**');

    // ---- 6. edit sheet scrolls -------------------------------------------
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`text=${FIXTURE}`, { timeout: 20000 });
    await page.locator('li', { hasText: FIXTURE }).first().locator(`text=${FIXTURE}`).click();
    await page.waitForSelector('.sheet', { timeout: 20000 });
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));

    const sheet = await page.evaluate(() => {
      const el = document.querySelector('.sheet');
      const body = el?.querySelector('.sheet-body');
      const foot = el?.querySelector('.sheet-foot');
      const r = el.getBoundingClientRect();
      return {
        sheetTop: Math.round(r.top),
        sheetBottom: Math.round(r.bottom),
        vh: window.innerHeight,
        bodyScrollable: body ? body.scrollHeight > body.clientHeight + 1 : null,
        bodyOverflow: body ? getComputedStyle(body).overflowY : null,
        bodyMinHeight: body ? getComputedStyle(body).minHeight : null,
        footTop: foot ? Math.round(foot.getBoundingClientRect().top) : null,
        footBottom: foot ? Math.round(foot.getBoundingClientRect().bottom) : null,
      };
    });
    ok('6.1 the sheet is on screen', sheet.sheetTop < sheet.vh - 100 && sheet.sheetBottom > 0, JSON.stringify(sheet));
    ok('6.2 the sheet fits the viewport', sheet.sheetBottom <= sheet.vh + 1, JSON.stringify(sheet));
    ok('6.3 the body is the scrolling region', sheet.bodyOverflow === 'auto', JSON.stringify(sheet));
    ok('6.4 the body can shrink (min-height 0)', sheet.bodyMinHeight === '0px', JSON.stringify(sheet));
    ok('6.5 the footer is inside the viewport', sheet.footBottom !== null && sheet.footBottom <= sheet.vh + 1,
      JSON.stringify(sheet));

    const save = page.locator('.sheet-foot button:has-text("Save")').first();
    ok('6.6 Save is visible without scrolling', await save.isVisible());

    // The Notes field must be reachable by scrolling the body.
    const notesReachable = await page.evaluate(() => {
      const body = document.querySelector('.sheet-body');
      const notes = document.querySelector('.sheet #ex-notes');
      if (!body || !notes) return { found: false };
      body.scrollTop = body.scrollHeight;
      const r = notes.getBoundingClientRect();
      return { found: true, top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight };
    });
    ok('6.7 Notes can be scrolled into view',
      notesReachable.found && notesReachable.top < notesReachable.vh && notesReachable.bottom > 0,
      JSON.stringify(notesReachable));

    await page.screenshot({ path: '/home/kit/ledger/shots/ux-sheet-390.png' });
    await page.keyboard.press('Escape');

    // ---- 7. caching between tab switches ---------------------------------
    const nav = 'nav[aria-label="Sections"]:visible';
    await page.click(`${nav} a[href="/money"]`);
    await page.waitForSelector('h1', { timeout: 20000 });
    await page.click(`${nav} a[href="/bills"]`);
    await page.waitForSelector('h1', { timeout: 20000 });

    // Coming back must NOT show a skeleton: the cached copy paints first.
    await page.click(`${nav} a[href="/money"]`);
    const sawSkeleton = await page.evaluate(() => document.querySelectorAll('.skel').length);
    ok('7.1 returning to a visited tab shows no skeleton', sawSkeleton === 0, `${sawSkeleton} skeletons`);

    const hasContent = await page.evaluate(() => /[0-9]/.test(document.body.innerText));
    ok('7.2 the cached data is on screen immediately', hasContent);

    // ---- 8. desktop sanity ------------------------------------------------
    const wide = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const dp = await wide.newPage();
    await dp.goto(BASE, { waitUntil: 'domcontentloaded' });
    await dp.fill('input[type="password"]', PASSCODE);
    await dp.press('input[type="password"]', 'Enter');
    await dp.waitForSelector(nav, { timeout: 20000 });
    await dp.click(`${nav} a[href="/bills"]`);
    await dp.waitForSelector('text=left after bills', { timeout: 20000 });
    const dgeo = await dp.evaluate(() => ({
      vw: document.documentElement.clientWidth, scrollW: document.documentElement.scrollWidth,
    }));
    ok('8.1 bills does not overflow at 1280px', dgeo.scrollW <= dgeo.vw, JSON.stringify(dgeo));
    await dp.screenshot({ path: '/home/kit/ledger/shots/ux-bills-1280.png', fullPage: true });
    await wide.close();

    await page.click(`${nav} a[href="/bills"]`);
    await page.waitForSelector('text=left after bills', { timeout: 20000 });
    await page.screenshot({ path: '/home/kit/ledger/shots/ux-bills-390.png', fullPage: true });
    const realErrors = pageErrors.filter((m) => !/50\d|Failed to load resource|nope/i.test(m));
    ok('9.1 no uncaught errors during the sweep', realErrors.length === 0, realErrors.join(' | '));
  } finally {
    for (const fn of cleanup.reverse()) {
      try { await fn(); } catch (err) { console.log(`  cleanup warning: ${err.message}`); }
    }
    await browser.close();
  }

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) { console.log(`failed: ${failures.join(', ')}`); process.exit(1); }
}

main().catch((err) => { console.error(err); process.exit(1); });
