#!/usr/bin/env node
/**
 * Browser sweep against the LIVE https URL, not localhost. Localhost has
 * passed 44/44 before while the real site was a blank white screen.
 *
 * Fixtures carry a per-run id and cleanup lives in a finally, because this
 * writes to the same database Karen uses.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';

import { chromium } from '/home/kit/node_modules/playwright/index.mjs';

const BASE = process.env.BASE || 'https://warily-vigilantly-factual-catbird.kitten.space';
const PASSCODE = process.env.PASSCODE || 'dandan2020';
const SHOTS = '/home/kit/ledger/shots';
const LOCK = '/tmp/ledger-ui-check.lock';
const RUN = Math.random().toString(36).slice(2, 8);
const FIX = `ui-${RUN}`;

// A phone shows the bottom tab bar and a desktop shows the left rail. Only one
// is ever in the layout, so always drive the visible one.
const NAVSEL = 'nav[aria-label="Sections"]:visible';

// Two concurrent runs against one live database delete each other's fixtures
// and then time out waiting for them. Refuse rather than produce a mystery.
if (existsSync(LOCK)) {
  const pid = Number(readFileSync(LOCK, 'utf8').trim());
  let alive = false;
  try { process.kill(pid, 0); alive = true; } catch { alive = false; }
  // PID reuse is real: a killed run left 28405 behind and an unrelated process
  // later took that number, so the liveness check said "still running" forever.
  // A lock older than the longest plausible run is stale whatever the pid says.
  const ageMin = (Date.now() - statSync(LOCK).mtimeMs) / 60000;
  if (alive && ageMin < 20) {
    console.error(`another ui-check is running (pid ${pid}, ${ageMin.toFixed(1)} min). refusing.`);
    process.exit(2);
  }
  if (ageMin >= 20) console.warn(`ignoring a stale lock (${ageMin.toFixed(0)} min old)`);
}
writeFileSync(LOCK, String(process.pid));
mkdirSync(SHOTS, { recursive: true });

let pass = 0; let fail = 0;
const failures = [];
const ok = (name, cond, extra = '') => {
  if (cond) { pass += 1; console.log(`  ok    ${name}`); }
  else {
    fail += 1;
    failures.push(name);
    console.log(`  FAIL  ${name}${extra ? `\n        ${extra}` : ''}`);
  }
};

const settle = (page) => page.evaluate(
  () => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))),
);

const shot = async (page, name) => {
  await settle(page);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
};

/** Is this element actually reachable by a thumb, or covered by something? */
const topmostIsSelf = (page, selector) => page.$eval(selector, (el) => {
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return { hit: false, why: 'zero size' };
  const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { hit: el.contains(at) || at === el, why: at?.tagName + '.' + at?.className };
});

let browser;
const cleanupNames = [];

async function cleanup() {
  try {
    const res = await fetch(`${BASE}/api/health`);
    if (!res.ok) return;
  } catch { return; }
  const { execSync } = await import('node:child_process');
  try {
    execSync('node server/scripts/clean-fixtures.js', { cwd: '/home/kit/ledger', stdio: 'pipe' });
  } catch (err) {
    console.error('cleanup failed:', err.message);
  }
}

process.on('SIGINT', async () => { await cleanup(); process.exit(130); });
process.on('SIGTERM', async () => { await cleanup(); process.exit(143); });

try {
  browser = await chromium.launch();
  // NOT isMobile:true. Chromium's mobile emulation widened the layout
  // viewport to 895px, which made every "no overflow" assertion vacuously
  // true and pushed the fixed tab bar below the real screen.
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
  });
  const page = await phone.newPage();

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  // ------------------------------------------------------------ 1. lock screen
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('#passcode', { timeout: 15000 });
  ok('1.1 lock screen renders for a stranger', await page.isVisible('#passcode'));
  ok('1.2 the app name is shown', (await page.textContent('h1')).includes('Ledger'));
  ok('1.3 no finance data leaks before unlocking',
    !(await page.content()).includes('Car loan'));
  await shot(page, '01-lock-390');

  await page.fill('#passcode', 'definitely-wrong');
  await page.click('button[type=submit]');
  await page.waitForSelector('[role=alert]', { timeout: 10000 });
  const refusal = await page.textContent('[role=alert]');
  ok('1.4 a wrong passcode is refused', /wrong passcode|too many attempts/.test(refusal), refusal);
  ok('1.5 the field is cleared after a bad try', (await page.inputValue('#passcode')) === '');

  await page.fill('#passcode', PASSCODE);
  await page.click('button[type=submit]');
  await page.waitForSelector(NAVSEL, { timeout: 20000 });
  ok('1.6 the right passcode gets in', await page.isVisible(NAVSEL));

  // -------------------------------------------------------------- 2. home
  await page.waitForSelector('.card', { timeout: 15000 });
  await settle(page);
  const homeText = await page.innerText('main');
  ok('2.1 the leftover headline is a peso figure', /₱[\d,]+/.test(homeText));
  ok('2.2 the paycheck section rendered', homeText.includes('Paychecks'));
  ok('2.3 the fx rate is shown', /rate/i.test(homeText) && /₱\d+\.\d\d/.test(homeText));

  const cards = await page.$$eval('article.card', (els) => els.map((el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), text: el.innerText.slice(0, 40) };
  }));
  ok('2.4 paycheck cards exist', cards.length >= 2, `got ${cards.length}`);
  ok('2.5 paycheck cards have real width, not zero',
    cards.every((c) => c.w > 200), JSON.stringify(cards.map((c) => c.w)));
  ok('2.6 paycheck cards have real height',
    cards.every((c) => c.h > 150), JSON.stringify(cards.map((c) => c.h)));
  ok('2.7 exactly one is marked as the current paycheck',
    (await page.$$('article.card .chip.teal')).length === 1);
  ok('2.8 the savings goal bar is on screen',
    (await page.$$('[role=progressbar]')).length >= 1);
  const bar = await page.$eval('[role=progressbar]', (el) => ({
    now: el.getAttribute('aria-valuenow'), w: el.getBoundingClientRect().width,
  }));
  ok('2.9 the goal bar has a real value and width', Number(bar.now) >= 0 && bar.w > 100, JSON.stringify(bar));
  ok('2.10 net worth lists her three accounts',
    homeText.includes('BPI') && homeText.includes('GoTyme') && homeText.includes('Maribank'));
  ok('2.11 nothing overflows sideways at 390px',
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    `scrollWidth ${await page.evaluate(() => document.documentElement.scrollWidth)}`);
  await shot(page, '02-home-390');

  // ------------------------------------------------------------- 3. bills
  await page.click(`${NAVSEL} a[href="/bills"]`);
  await page.waitForSelector('text=/coming in/i', { timeout: 15000 });
  await settle(page);
  const billsText = (await page.innerText('main')).toLowerCase();
  ok('3.1 the bills page loads', billsText.includes('coming in'), billsText.slice(0, 80));
  ok('3.2 her seeded bills are listed', (await page.innerText('main')).includes('Car loan'));
  ok('3.3 spread costs are separated out',
    (await page.innerText('main')).includes('Spread across the month'));

  // Add
  await page.click('button:has-text("Add")');
  await page.waitForSelector('#ex-name');
  await page.fill('#ex-name', `${FIX} netflix`);
  await page.fill('#ex-amount', '549');
  await page.fill('#ex-day', '1');
  await page.selectOption('#ex-cat', 'Personal');
  cleanupNames.push(`${FIX} netflix`);
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('.sheet', { state: 'detached', timeout: 15000 });

  // A cost added mid-month belongs to that month, even if its day has passed:
  // leaving it out understated the month. It must not be called overdue,
  // though, since it cannot be late for a month it did not exist in.
  ok('3.4a a new bill lands in the month it was added',
    (await page.innerText('main')).includes(`${FIX} netflix`));
  ok('3.4b but it is not flagged overdue', await page.evaluate((name) => {
    const li = [...document.querySelectorAll('li')].find((n) => n.innerText.includes(name));
    return li ? !/overdue/i.test(li.innerText) : false;
  }, `${FIX} netflix`));
  await page.click('button[aria-label="Next month"]');
  await page.waitForSelector(`text=${FIX} netflix`, { timeout: 15000 });
  ok('3.4 an expense can be added from the UI', await page.isVisible(`text=${FIX} netflix`));

  // Edit
  await page.click(`button[aria-label="Edit ${FIX} netflix"]`);
  await page.waitForSelector('#ex-amount');
  ok('3.5 the edit form is prefilled', (await page.inputValue('#ex-amount')) === '549');
  await page.fill('#ex-amount', '649');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('.sheet', { state: 'detached', timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('main').innerText.includes('649'), { timeout: 15000 });
  ok('3.6 an edit sticks', (await page.innerText('main')).includes('649'));

  // Mark paid
  const payBtn = `button[aria-label="Mark ${FIX} netflix paid"]`;
  await page.click(payBtn);
  await page.waitForSelector(`button[aria-label="Mark ${FIX} netflix unpaid"]`, { timeout: 15000 });
  ok('3.7 a bill can be ticked off', await page.isVisible(`button[aria-label="Mark ${FIX} netflix unpaid"]`));
  await page.click(`button[aria-label="Mark ${FIX} netflix unpaid"]`);
  await page.waitForSelector(payBtn, { timeout: 15000 });
  ok('3.8 and un-ticked', await page.isVisible(payBtn));

  // Tap targets and overlap: a fixed tab bar must not sit on a row action.
  const tapCheck = await topmostIsSelf(page, payBtn);
  ok('3.9 the paid toggle is not covered by anything', tapCheck.hit, tapCheck.why);
  const size = await page.$eval(payBtn, (el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  ok('3.10 the paid toggle clears the 24px minimum', size.w >= 24 && size.h >= 24, JSON.stringify(size));

  await shot(page, '03-bills-list-390');

  // Back to the current month: the calendar marks today, and today only
  // exists in this month's grid.
  await page.click('button[aria-label="Previous month"]');
  await page.waitForTimeout(1500);

  // Calendar
  await page.click('button[role=tab]:has-text("calendar")');
  await page.waitForSelector('button[aria-current=date]', { timeout: 15000 });
  await settle(page);
  const calCells = await page.$$('.card button[aria-label]');
  ok('3.11 the calendar renders cells', calCells.length > 20, `got ${calCells.length}`);
  ok('3.12 today is marked on the calendar', await page.isVisible('button[aria-current=date]'));
  const calBox = await page.$eval('button[aria-current=date]', (el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  ok('3.13 calendar cells have real size', calBox.w > 30 && calBox.h > 40, JSON.stringify(calBox));
  ok('3.14 the list is really hidden in calendar view, not just behind it',
    await page.evaluate(() => {
      const secs = [...document.querySelectorAll('section.card')];
      const list = secs.find((s) => s.innerText.startsWith('On a date'));
      return !list || list.getBoundingClientRect().height === 0;
    }));
  ok('3.15 the calendar has a legend', (await page.innerText('main')).includes('overdue'));
  await shot(page, '04-bills-calendar-390');
  await page.click('button[role=tab]:has-text("list")');
  await page.waitForTimeout(800);
  await page.click('button[aria-label="Next month"]');
  await page.waitForSelector(payBtn, { timeout: 15000 });

  // Delete
  await page.click(`button[aria-label="Edit ${FIX} netflix"]`);
  await page.waitForSelector('.sheet');
  await page.click('.sheet button:has-text("Delete")');
  await page.click('.sheet button:has-text("Sure?")');
  await page.waitForSelector(`text=${FIX} netflix`, { state: 'detached', timeout: 15000 });
  ok('3.16 an expense can be deleted', !(await page.innerText('main')).includes(`${FIX} netflix`));
  await page.click('button[aria-label="Previous month"]');
  await page.waitForTimeout(1200);

  // ------------------------------------------------------------- 4. money
  await page.click(`${NAVSEL} a[href="/money"]`);
  await page.waitForSelector('text=net worth', { timeout: 15000 });
  await settle(page);
  ok('4.1 the money page loads', (await page.innerText('main')).toLowerCase().includes('net worth'));
  ok('4.2 income is summarised', (await page.innerText('main')).includes('Income'));
  ok('4.3 the goal shows how much is left', /to go/.test(await page.innerText('main')));

  await page.click('button[aria-label="Update GoTyme balance"]');
  await page.waitForSelector('#bal');
  await page.fill('#bal', '18500');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('.sheet', { state: 'detached', timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelector('main').innerText.includes('18,500'), { timeout: 15000 },
  );
  ok('4.4 a balance can be set from the UI', (await page.innerText('main')).includes('18,500'));
  // innerText reflects text-transform, so the eyebrow reads "NET WORTH".
  ok('4.5 net worth picked the new balance up',
    await page.evaluate(() => {
      const m = document.querySelector('main').innerText.match(/net worth\s*₱([\d,]+)/i);
      return m ? Number(m[1].replace(/,/g, '')) >= 18500 : false;
    }), (await page.innerText('main')).slice(0, 60).replace(/\n/g, ' | '));

  await page.click('button:has-text("House extension")');
  await page.waitForSelector('#contrib', { timeout: 15000 });
  await page.fill('#contrib', '1000');
  await page.click('.sheet button:has-text("Add")');
  await page.waitForFunction(
    () => document.querySelector('.sheet')?.innerText.includes('1,000'), { timeout: 15000 },
  );
  ok('4.6 money can be put into a goal', (await page.innerText('.sheet')).includes('1,000'));
  await page.click('.sheet button:has-text("Remove")');
  await page.click('.sheet button:has-text("Sure?")');
  await page.waitForFunction(
    () => document.querySelector('.sheet')?.innerText.includes('Nothing put in yet'), { timeout: 15000 },
  );
  ok('4.7 a contribution can be taken back out',
    (await page.innerText('.sheet')).includes('Nothing put in yet'));
  await page.click('.sheet button[aria-label=Close]');
  await page.waitForSelector('.sheet', { state: 'detached' });
  await shot(page, '05-money-390');

  // ------------------------------------------------------------- 5. notes
  await page.click(`${NAVSEL} a[href="/notes"]`);
  await page.waitForSelector('[role=tablist]', { timeout: 15000 });
  await page.waitForSelector('article, li .card, li button.card', { timeout: 15000 }).catch(() => {});
  await settle(page);
  const journalCount = await page.$$eval('ul > li', (els) => els.length);
  ok('5.1 journal entries are listed', journalCount >= 40, `got ${journalCount}`);
  ok('5.2 a real entry is visible', (await page.innerText('main')).toLowerCase().includes('jazer'));

  await page.click('button[role=tab]:has-text("Work log")');
  await page.waitForFunction(
    () => document.querySelectorAll('ul > li').length > 0 && document.querySelectorAll('ul > li').length < 40,
    { timeout: 15000 },
  );
  const workCount = await page.$$eval('ul > li', (els) => els.length);
  ok('5.3 the work log has its 16 entries', workCount === 16, `got ${workCount}`);

  await page.click('button[role=tab]:has-text("Verses")');
  await page.waitForFunction(() => document.querySelectorAll('ul > li').length === 4, { timeout: 15000 });
  ok('5.4 all 4 poems are there', (await page.$$('ul > li')).length === 4);
  ok('5.5 poem line breaks survived',
    await page.$eval('.poem-body', (el) => getComputedStyle(el).whiteSpace.startsWith('pre')));
  ok('5.6 a poem body has more than one line',
    await page.$eval('.poem-body', (el) => el.getBoundingClientRect().height > 60));
  await shot(page, '06-notes-390');

  await page.click('button[role=tab]:has-text("Journal")');
  await page.waitForFunction(() => document.querySelectorAll('ul > li').length > 40, { timeout: 15000 });
  await page.click('button:has-text("New")');
  await page.waitForSelector('#n-body');
  await page.fill('#n-body', `${FIX} a note written by the browser sweep`);
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('.sheet', { state: 'detached', timeout: 15000 });
  ok('5.7 a journal entry can be written', (await page.innerText('main')).includes(`${FIX} a note`));
  await page.click(`text=${FIX} a note written by the browser sweep`);
  await page.waitForSelector('.sheet button:has-text("Delete")');
  await page.click('.sheet button:has-text("Delete")');
  await page.click('.sheet button:has-text("Sure?")');
  await page.waitForSelector('.sheet', { state: 'detached', timeout: 15000 });
  ok('5.8 and deleted again', !(await page.innerText('main')).includes(`${FIX} a note`));

  // ----------------------------------------------------------- 6. figures
  await page.click(`${NAVSEL} a[href="/figures"]`);
  await page.waitForSelector('input[type=search]', { timeout: 15000 });
  await page.waitForFunction(() => document.querySelectorAll('ul > li').length > 40, { timeout: 20000 });
  const figApi = await page.request.fetch(`${BASE}/api/content/figures`);
  const figJson = await figApi.json();
  const expectedFigures = figJson.figures.length;
  ok(`6.1 all ${expectedFigures} figures are listed`,
    (await page.$$('ul > li')).length === expectedFigures,
    `dom ${(await page.$$('ul > li')).length} vs api ${expectedFigures}`);
  ok('6.2 the newest is first',
    (await page.innerText('ul > li:first-child')).includes(figJson.figures[0].name),
    figJson.figures[0].name);

  await page.fill('input[type=search]', 'circe');
  await page.waitForFunction(() => document.querySelectorAll('ul > li').length === 1, { timeout: 10000 });
  ok('6.3 search narrows the list', (await page.innerText('ul > li')).includes('Circe'));
  await page.fill('input[type=search]', '');
  // Never hardcode the count: a figure is added most days and the suite would
  // break every time. This is the second copy of that mistake in one file.
  await page.waitForFunction(
    (n) => document.querySelectorAll('ul > li').length === n,
    expectedFigures, { timeout: 10000 });

  await page.click('ul > li:first-child button[aria-expanded]');
  await page.waitForSelector('.prose-import', { timeout: 20000 });
  await settle(page);
  const essay = await page.$eval('.prose-import', (el) => ({
    chars: el.innerText.length,
    h: Math.round(el.getBoundingClientRect().height),
    paras: el.querySelectorAll('p').length,
    quotes: el.querySelectorAll('blockquote').length,
    scripts: el.querySelectorAll('script').length,
  }));
  ok('6.4 the full essay loaded', essay.chars > 5000, JSON.stringify(essay));
  ok('6.5 it kept its paragraphs', essay.paras > 10, `${essay.paras} paragraphs`);
  ok('6.6 it kept its pull quotes', essay.quotes > 2, `${essay.quotes} quotes`);
  ok('6.7 no scripts came along with it', essay.scripts === 0);
  ok('6.8 the essay is actually laid out, not zero height', essay.h > 2000, `height ${essay.h}`);
  ok('6.9 the essay does not overflow 390px',
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  ok('6.10 imported text uses the app ink colour, not a stale variable',
    await page.$eval('.prose-import p', (el) => {
      const c = getComputedStyle(el).color;
      return c !== 'rgba(0, 0, 0, 0)' && c !== 'rgb(0, 0, 0)';
    }));
  await shot(page, '07-figure-open-390');

  // ---------------------------------------------------------- 7. settings
  await page.click('a[aria-label=Settings]');
  await page.waitForSelector('#s-amount', { timeout: 15000 });
  await settle(page);
  ok('7.1 settings loads', (await page.innerText('main')).includes('Settings'));
  ok('7.2 the salary editor is prefilled', (await page.inputValue('#s-amount')) === '1625');
  ok('7.3 the frequency is biweekly', (await page.inputValue('#s-freq')) === 'biweekly');
  ok('7.4 the anchor payday is set', (await page.inputValue('#s-anchor')) === '2026-08-28');
  ok('7.5 the peso equivalent is shown', /₱[\d,]+ a month/.test(await page.innerText('main')));
  ok('7.6 26 paychecks a year is stated', (await page.innerText('main')).includes('26 paychecks'));
  ok('7.7 the exchange rate section is there', (await page.innerText('main')).includes('per dollar'));

  await page.fill('#s-amount', '1700');
  await page.click('form button[type=submit]');
  // Wait for the TEXT, not merely for a toast element: an unrelated toast
  // still lingering would satisfy the weaker check.
  const sawToast = await page.waitForFunction(
    () => [...document.querySelectorAll('[role=status]')]
      .some((el) => el.innerText.includes('Income updated')),
    { timeout: 15000 },
  ).then(() => true).catch(() => false);
  ok('7.8 saving income confirms with a toast', sawToast,
    (await page.innerText('.toasts').catch(() => 'no toasts')).slice(0, 80));
  await page.waitForFunction(() => document.querySelector('main').innerText.includes('₱'), { timeout: 10000 });
  await page.fill('#s-amount', '1625');
  await page.click('form button[type=submit]');
  await page.waitForTimeout(1200);
  ok('7.9 income is back to 1625', (await page.inputValue('#s-amount')) === '1625');

  const toastCover = await topmostIsSelf(page, 'form button[type=submit]');
  ok('7.10 a toast does not cover the button underneath it', toastCover.hit, toastCover.why);
  await shot(page, '08-settings-390');

  // ------------------------------------------------------- 8. light / dark
  const darkBg = await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    return getComputedStyle(document.body).backgroundColor;
  });
  await settle(page);
  await shot(page, '09-settings-dark-390');
  const lightBg = await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    return getComputedStyle(document.body).backgroundColor;
  });
  ok('8.1 dark and light really differ', darkBg !== lightBg, `${darkBg} vs ${lightBg}`);
  ok('8.2 dark is dark', (() => {
    const [r, g, b] = darkBg.match(/\d+/g).map(Number);
    return (r + g + b) / 3 < 60;
  })(), darkBg);
  ok('8.3 light is light', (() => {
    const [r, g, b] = lightBg.match(/\d+/g).map(Number);
    return (r + g + b) / 3 > 200;
  })(), lightBg);

  // The rail and the mobile header both carry a theme button. Only one is in
  // the layout at a time, so target the visible one or Playwright picks the
  // hidden one and waits forever.
  await page.click('button[aria-label^="Switch to"]:visible');
  await page.waitForTimeout(300);
  const stored = await page.evaluate(() => localStorage.getItem('ledger.theme'));
  ok('8.4 the theme choice is remembered', stored === 'dark' || stored === 'light', String(stored));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector(NAVSEL, { timeout: 20000 });
  ok('8.5 the theme survives a reload',
    (await page.evaluate(() => document.documentElement.dataset.theme)) === stored);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; localStorage.setItem('ledger.theme', 'light'); });

  // --------------------------------------------------------------- 9. PWA
  const manifest = await page.evaluate(async () => {
    const res = await fetch('/manifest.webmanifest');
    return { status: res.status, body: await res.json() };
  });
  ok('9.1 the manifest is served', manifest.status === 200);
  ok('9.2 it is standalone', manifest.body.display === 'standalone');
  ok('9.3 it has a 512 icon', manifest.body.icons.some((i) => i.sizes === '512x512'));
  ok('9.4 it has a maskable icon', manifest.body.icons.some((i) => i.purpose === 'maskable'));
  const icons = await page.evaluate(async () => {
    const out = {};
    for (const p of ['/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png', '/icons/apple-touch-icon.png']) {
      out[p] = (await fetch(p)).status;
    }
    return out;
  });
  ok('9.5 every icon actually exists', Object.values(icons).every((s) => s === 200), JSON.stringify(icons));
  ok('9.6 the apple touch icon is linked', await page.$('link[rel="apple-touch-icon"]') !== null);
  ok('9.7 the status bar style is set for iOS',
    await page.$('meta[name="apple-mobile-web-app-status-bar-style"]') !== null);
  ok('9.8 the viewport covers the notch',
    (await page.getAttribute('meta[name=viewport]', 'content')).includes('viewport-fit=cover'));

  const sw = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return { registered: Boolean(reg), scope: reg?.scope, active: Boolean(reg?.active) };
  });
  ok('9.9 the service worker registered', sw.registered, JSON.stringify(sw));
  ok('9.10 it controls the whole app', sw.scope?.endsWith('/'), sw.scope);

  const swBody = await page.evaluate(async () => (await fetch('/sw.js')).text());
  ok('9.11 the worker precaches the real hashed bundles', /\/assets\/index-[\w-]+\.js/.test(swBody));
  ok('9.12 no build placeholders were shipped',
    !swBody.includes('__ASSETS__') && !swBody.includes('__BUILD__'));
  // Identity IS cached, but only ever a positive session, and it is dropped
  // on lock. A cached {"unlocked":false} would open the app as a stranger
  // forever; a cached {"unlocked":true} is what keeps her signed in offline.
  ok('9.13 identity is only cached when it is a real session',
    swBody.includes('identityFirst')
    && /unlocked === true/.test(swBody)
    && /cache\.delete\(request\)/.test(swBody));
  ok('9.14 locking drops the offline copy', swBody.includes('ledger:purge'));

  // -------------------------------------------------------- 10. safe areas
  const insets = await page.evaluate(() => {
    const bar = document.querySelector('.tabbar');
    const top = document.querySelector('.topbar');
    return {
      tabBottom: Math.round(bar.getBoundingClientRect().bottom),
      viewport: window.innerHeight,
      topPad: getComputedStyle(top).paddingTop,
      shellPadLeft: getComputedStyle(document.querySelector('main')).paddingLeft,
    };
  });
  ok('10.1 the tab bar sits on the bottom edge',
    Math.abs(insets.tabBottom - insets.viewport) <= 1, JSON.stringify(insets));
  ok('10.2 side gutters do not collapse to zero on a normal screen',
    parseFloat(insets.shellPadLeft) >= 16, insets.shellPadLeft);
  const css = await page.evaluate(async () => {
    const href = [...document.styleSheets].map((s) => s.href).find((h) => h && h.includes('/assets/'));
    return (await fetch(href)).text();
  });
  ok('10.3 the served css really contains safe-area insets',
    css.includes('safe-area-inset-top') && css.includes('safe-area-inset-bottom'));
  ok('10.4 gutters use max() so insets cannot shrink them', css.includes('max(16px,env(safe-area-inset-left))')
    || css.includes('max(16px, env(safe-area-inset-left))'));
  ok('10.5 blur is confined to the header, away from inputs',
    (css.match(/backdrop-filter/g) || []).length <= 3);

  // ----------------------------------------------------------- 11. offline
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector(NAVSEL, { timeout: 20000 });
  await page.click(`${NAVSEL} a[href="/figures"]`);
  await page.waitForFunction(() => document.querySelectorAll('ul > li').length > 40, { timeout: 20000 });

  // Let the freshly deployed worker take control before cutting the network,
  // otherwise this measures the previous build's caching behaviour.
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  });
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('ul > li').length > 40, { timeout: 20000 })
    .catch(() => {});

  await phone.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const offlineBody = await page.innerText('body').catch(() => '');
  ok('11.1 the shell still boots offline', offlineBody.length > 50, `body was ${offlineBody.length} chars`);
  ok('11.2 offline is not a blank white page',
    await page.evaluate(() => document.querySelectorAll('script[src]').length === 0
      || Boolean(document.querySelector('#root')?.children.length)));
  const offlineText = await page.innerText('body');
  ok('11.3 she is still signed in offline, not bounced to the lock screen',
    !offlineText.includes('Passcode') && !offlineText.includes('PASSCODE'),
    offlineText.slice(0, 90).replace(/\n/g, ' | '));
  ok('11.4 cached figures are readable offline',
    /Aphra|Circe|figures/i.test(offlineText), offlineText.slice(0, 90).replace(/\n/g, ' | '));
  await shot(page, '10-offline-390');
  await phone.setOffline(false);

  // -------------------------------------------------------- 12. desktop
  const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const dpage = await desk.newPage();
  await dpage.goto(BASE, { waitUntil: 'networkidle' });
  await dpage.waitForSelector('#passcode', { timeout: 15000 });
  await dpage.fill('#passcode', PASSCODE);
  await dpage.click('button[type=submit]');
  await dpage.waitForSelector(NAVSEL, { timeout: 20000 });
  await settle(dpage);
  ok('12.1 desktop loads too', await dpage.isVisible(NAVSEL));
  ok('12.2 content is centred, not stretched edge to edge',
    await dpage.$eval('main', (el) => el.getBoundingClientRect().width < 900));
  const dnavs = await dpage.evaluate(() => {
    const vis = (s) => { const e = document.querySelector(s); return Boolean(e) && e.getBoundingClientRect().height > 0; };
    return { rail: vis('.rail'), tabs: vis('.tabbar') };
  });
  ok('12.3 desktop shows the rail and hides the tab bar', dnavs.rail && !dnavs.tabs, JSON.stringify(dnavs));
  ok('12.4 the rail is sticky so nav is always reachable',
    await dpage.$eval('.rail', (el) => getComputedStyle(el).position === 'sticky'));
  ok('12.5 the summary band is two columns on a wide screen',
    await dpage.$eval('.col-2', (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length === 2)
      .catch(() => false));
  const railHit = await dpage.$eval(`${NAVSEL} a[href="/money"]`, (el) => {
    const r = el.getBoundingClientRect();
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return el.contains(at) || at === el;
  });
  ok('12.6 rail links are not covered by anything', railHit);
  await shot(dpage, '11-home-desktop');
  await dpage.click(`${NAVSEL} a[href="/bills"]`);
  await dpage.waitForSelector('text=/coming in/i', { timeout: 15000 });
  await settle(dpage);
  await shot(dpage, '12-bills-desktop');
  await dpage.click(`${NAVSEL} a[href="/figures"]`);
  await dpage.waitForFunction(() => document.querySelectorAll('ul > li').length > 40, { timeout: 20000 });
  await settle(dpage);
  await shot(dpage, '13-figures-desktop');
  await desk.close();

  // -------------------------------------------------- 13. responsiveness
  const sweep = async (pg, tag) => {
    for (const [name, href] of [['home', '/'], ['bills', '/bills'], ['money', '/money'],
      ['notes', '/notes'], ['figures', '/figures']]) {
      if (href === '/') await pg.click(`${NAVSEL} a[href="/"]`);
      else await pg.click(`${NAVSEL} a[href="${href}"]`);
      await pg.waitForTimeout(1600);
      const r = await pg.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        // Children of a horizontal scroller are meant to stick out; they are
        // clipped by their parent and do not widen the document.
        const inScroller = (el) => {
          for (let n = el.parentElement; n; n = n.parentElement) {
            const o = getComputedStyle(n).overflowX;
            if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
          }
          return false;
        };
        const bad = [];
        document.querySelectorAll('*').forEach((el) => {
          const b = el.getBoundingClientRect();
          if (b.width > 0 && (b.right > vw + 1 || b.left < -1) && !inScroller(el)) {
            bad.push(el.tagName + '.' + String(el.className || '').slice(0, 40));
          }
        });
        return { vw, scrollW: document.documentElement.scrollWidth, bad };
      });
      ok(`13.${tag} ${name} does not overflow at ${r.vw}px`,
        r.bad.length === 0 && r.scrollW <= r.vw + 1, `${r.scrollW}px wide · ${r.bad[0] || ''}`);
    }
  };
  await sweep(page, 'a');

  const navs = await page.evaluate(() => {
    const vis = (s) => { const e = document.querySelector(s); return Boolean(e) && e.getBoundingClientRect().height > 0; };
    return { rail: vis('.rail'), tabs: vis('.tabbar') };
  });
  ok('13.b a phone shows the tab bar and not the rail', navs.tabs && !navs.rail, JSON.stringify(navs));

  // ------------------------------------------------------- 14. hygiene
  // The 401s are ones this suite provokes on purpose: the wrong-passcode try
  // and the logged-out reload at the end.
  const realErrors = consoleErrors.filter(
    (e) => !/Failed to fetch|NetworkError|net::ERR|503|offline|status of 401/i.test(e),
  );
  ok('14.1 no console errors during the sweep', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector(NAVSEL, { timeout: 20000 });
  await page.click('a[aria-label=Settings]');
  await page.waitForSelector('button:has-text("Lock Ledger")', { timeout: 15000 });
  await page.click('button:has-text("Lock Ledger")');
  await page.waitForSelector('#passcode', { timeout: 15000 });
  ok('14.2 locking returns to the lock screen', await page.isVisible('#passcode'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#passcode', { timeout: 15000 });
  ok('14.3 it stays locked after a reload', await page.isVisible('#passcode'));
} catch (err) {
  fail += 1;
  failures.push(`threw: ${err.message}`);
  console.log(`\n  THREW  ${err.message}\n${err.stack?.split('\n').slice(1, 4).join('\n')}`);
} finally {
  // Always. A suite that dies mid-run must still tidy up after itself.
  if (browser) await browser.close().catch(() => {});
  await cleanup();
  rmSync(LOCK, { force: true });
}

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) console.log(`failed: ${failures.join(', ')}`);
console.log(`screenshots in ${SHOTS}`);
process.exit(fail ? 1 : 0);
