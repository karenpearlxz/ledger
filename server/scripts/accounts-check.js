/**
 * Browser checks for managing accounts from the Money page: adding, editing,
 * recolouring and removing, plus Maya being present and distinct.
 *
 * Runs against the live site and the real database, so the fixture carries a
 * per-run id and cleanup lives in `finally`, never on the happy path.
 */
import { chromium } from '/home/kit/node_modules/playwright/index.mjs';

const BASE = process.env.BASE || 'https://warily-vigilantly-factual-catbird.kitten.space';
const PASSCODE = process.env.PASSCODE || 'dandan2020';
const RUN = Math.random().toString(36).slice(2, 7);
const FIXTURE = `acct ${RUN} probe`;
const NAV = 'nav[aria-label="Sections"]:visible';

let passed = 0;
let failed = 0;
const fails = [];
function ok(label, cond, detail) {
  if (cond) { passed += 1; console.log(`  ok    ${label}`); return; }
  failed += 1; fails.push(label);
  console.log(`  FAIL  ${label}`);
  if (detail !== undefined) console.log(`        ${detail}`);
}

async function main() {
  const browser = await chromium.launch();
  let createdId = null;
  let jar = null;
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage();

    // A handler that throws makes no request and moves nothing, which reads as
    // "slow" rather than "broken". Fail on it directly.
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="password"]', PASSCODE);
    await page.press('input[type="password"]', 'Enter');
    await page.waitForSelector(NAV, { timeout: 20000 });
    ok('1.1 unlocks', true);

    await page.click(`${NAV} a[href="/money"]`);
    await page.waitForSelector('text=/net worth/i', { timeout: 20000 });

    // ------------------------------------------------------- 2. Maya exists
    const money = await page.innerText('main');
    ok('2.1 Maya is listed', money.includes('Maya'), money.slice(0, 160));

    const mayaColour = await page.evaluate(() => {
      const li = [...document.querySelectorAll('li')].find((n) => n.innerText.includes('Maya'));
      const dot = li && li.querySelector('span[style*="background"]');
      return dot ? getComputedStyle(dot).backgroundColor : null;
    });
    ok('2.2 Maya has its own colour', mayaColour === 'rgb(124, 92, 191)', mayaColour);

    const colours = await page.evaluate(() => [...document.querySelectorAll('li span[aria-hidden="true"]')]
      .map((n) => getComputedStyle(n).backgroundColor));
    ok('2.3 no two accounts share a colour', new Set(colours).size === colours.length, colours.join(' '));

    // -------------------------------------------------- 3. the add control
    const addBtn = page.locator('button:has-text("Add account")');
    ok('3.1 there is a visible Add account button', await addBtn.isVisible());

    await addBtn.click();
    await page.waitForSelector('.sheet', { timeout: 10000 });
    ok('3.2 the sheet opens', await page.locator('#acc-name').isVisible());
    ok('3.3 Save is reachable without scrolling', await page.evaluate(() => {
      const b = document.querySelector('.sheet-foot button[type="submit"]');
      if (!b) return false;
      const r = b.getBoundingClientRect();
      return r.bottom <= window.innerHeight + 1 && r.width > 0;
    }));

    // ------------------------------------------------------- 4. create one
    await page.fill('#acc-name', FIXTURE);
    await page.selectOption('#acc-kind', 'ewallet');
    await page.click('button[aria-label="pink"]');
    await page.fill('#bal', '4321');
    await page.fill('#acc-note', 'probe note');
    await page.locator('.sheet-foot button[type="submit"]').click();
    await page.waitForSelector('.sheet', { state: 'detached', timeout: 15000 });

    await page.waitForSelector(`text=${FIXTURE}`, { timeout: 15000 });
    ok('4.1 the new account appears in the list', true);

    const api = async (method, path, body) => {
      const r = await page.request.fetch(`${BASE}/api${path}`, {
        method, data: body, headers: { 'content-type': 'application/json' },
      });
      return { status: r.status(), json: await r.json().catch(() => null) };
    };
    const listed = await api('GET', '/accounts');
    const mine = listed.json.accounts.find((a) => a.name === FIXTURE);
    createdId = mine?.id ?? null;
    ok('4.2 it persisted server-side', Boolean(mine), JSON.stringify(listed.json.accounts.map((a) => a.name)));
    ok('4.3 the chosen colour was saved', mine?.color?.toLowerCase() === '#c4577f', mine?.color);
    ok('4.4 the type was saved', mine?.kind === 'ewallet', mine?.kind);
    ok('4.5 the starting balance was saved', mine?.balance === 4321, String(mine?.balance));
    ok('4.6 the note was saved', mine?.note === 'probe note', mine?.note);

    const shown = await page.innerText('main');
    ok('4.7 the balance shows on the row', shown.includes('4,321'), shown.slice(0, 200));

    // ---------------------------------------------------------- 5. edit it
    await page.click(`li:has-text("${FIXTURE}") button`);
    await page.waitForSelector('.sheet #acc-name', { timeout: 10000 });
    ok('5.1 the sheet opens prefilled', (await page.inputValue('#acc-name')) === FIXTURE);
    await page.fill('#acc-name', `${FIXTURE} renamed`);
    await page.fill('#bal', '5555');
    await page.locator('.sheet-foot button[type="submit"]').click();
    await page.waitForSelector('.sheet', { state: 'detached', timeout: 15000 });

    const after = (await api('GET', '/accounts')).json.accounts.find((a) => a.id === createdId);
    ok('5.2 the rename persisted', after?.name === `${FIXTURE} renamed`, after?.name);
    ok('5.3 the new balance persisted', after?.balance === 5555, String(after?.balance));

    // ---------------------------------------------- 6. net worth reflects it
    // Scope to the net worth card. The first .font-display on the page is the
    // app's own title, so an unscoped query "measured" the word Ledger.
    const nw = await page.evaluate(() => {
      const card = [...document.querySelectorAll('section')]
        .find((n) => /net worth/i.test(n.innerText));
      const el = card && card.querySelector('p.font-display, .font-display');
      return el ? el.innerText : null;
    });
    const expected = (await api('GET', '/accounts')).json.accounts
      .reduce((a, x) => a + (x.balance ?? 0), 0);
    ok('6.1 net worth includes the new account',
      nw && Number(nw.replace(/[^0-9.]/g, '')) === Math.round(expected), `${nw} vs ${expected}`);

    // -------------------------------------------------------- 7. remove it
    await page.click(`li:has-text("${FIXTURE} renamed") button`);
    await page.waitForSelector('.sheet #acc-name', { timeout: 10000 });
    const removeBtn = page.locator('.sheet-foot button:has-text("Remove")');
    ok('7.1 there is a visible Remove button', await removeBtn.isVisible());
    await removeBtn.click();
    // ConfirmButton swaps the label to "Sure?" once armed, so the original
    // locator no longer matches anything.
    const confirm = page.locator('.sheet-foot button:has-text("Sure?")');
    await confirm.waitFor({ timeout: 10000 });
    await confirm.click();
    await page.waitForSelector('.sheet', { state: 'detached', timeout: 15000 });

    const gone = (await api('GET', '/accounts')).json.accounts.some((a) => a.id === createdId);
    ok('7.2 the account is gone', !gone);
    if (!gone) createdId = null;
    ok('7.3 it disappears from the page',
      !(await page.innerText('main')).includes(`${FIXTURE} renamed`));

    // ------------------------------------------------------- 8. no damage
    const finalList = (await api('GET', '/accounts')).json.accounts.map((a) => a.name).sort();
    ok('8.1 her four real accounts survive',
      ['BPI', 'GoTyme', 'Maribank', 'Maya'].every((n) => finalList.includes(n)), finalList.join(', '));

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok('8.2 no horizontal overflow at 390px', overflow <= 1, String(overflow));

    ok('9.1 no uncaught errors', errors.length === 0, errors.join(' | '));
    jar = ctx;
  } finally {
    if (createdId) {
      // The run died mid-way; do not leave a probe in her real ledger.
      try {
        const ctx2 = jar || await browser.newContext();
        const pg = await ctx2.newPage();
        await pg.goto(BASE, { waitUntil: 'domcontentloaded' });
        await pg.fill('input[type="password"]', PASSCODE);
        await pg.press('input[type="password"]', 'Enter');
        await pg.waitForSelector(NAV, { timeout: 15000 });
        await pg.request.fetch(`${BASE}/api/accounts/${createdId}`, { method: 'DELETE' });
        console.log(`  swept fixture account ${createdId}`);
      } catch (e) {
        console.log(`  COULD NOT SWEEP ${createdId}: ${e.message}`);
      }
    }
    await browser.close();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (fails.length) console.log(`failed: ${fails.join(', ')}`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
