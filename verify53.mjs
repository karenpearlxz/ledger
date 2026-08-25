import { chromium } from '/home/kit/node_modules/playwright/index.mjs';

const BASE = 'https://warily-vigilantly-factual-catbird.kitten.space';
const PASSCODE = 'dandan2020';
const SLUG = 'olive-schreiner';
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, extra); } };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('#passcode', { timeout: 20000 });
  await page.fill('#passcode', PASSCODE);
  await page.press('#passcode', 'Enter');
  await page.waitForSelector('nav[aria-label="Sections"]:visible', { timeout: 20000 });
  ok('1 signed in', true);

  const api = await page.request.fetch(`${BASE}/api/content/figures`);
  ok('2 figures api 200', api.status() === 200, api.status());
  const json = await api.json();
  const mine = json.figures.find((f) => f.slug === SLUG);
  ok('3 schreiner present in api', !!mine);
  ok('4 ordinal is highest', mine && mine.ordinal === Math.max(...json.figures.map((f) => f.ordinal)), mine && mine.ordinal);
  ok('5 chip date is today', mine && /aug 25, 2026/.test(mine.chipDate || mine.chip_date || ''), JSON.stringify(mine && (mine.chipDate || mine.chip_date)));

  const det = await page.request.fetch(`${BASE}/api/content/figures/${SLUG}`);
  ok('6 detail api 200', det.status() === 200, det.status());
  const dj = await det.json();
  const body = JSON.stringify(dj);
  for (const s of ['LIFE&rsquo;S GIFTS', 'THE ARTIST&rsquo;S SECRET', 'IN A FAR-OFF WORLD',
    'THREE DREAMS IN A DESERT', 'LYNDALL SPEAKS', 'LYNDALL DIES', 'THE HUNTER, ENDING',
    'childhood &amp; early life', 'romantic life', 'life until death', 'their works']) {
    ok(`7 body contains ${s}`, body.includes(s));
  }
  ok('8 no raw unescaped tofu chars', !/\uFFFD/.test(body));

  await page.goto(`${BASE}/figures`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[aria-label="Search figures"]', { timeout: 20000 });
  const count = await page.evaluate(() => {
    const m = document.body.innerText.match(/(\d+) of them, newest first/);
    return m ? Number(m[1]) : -1;
  });
  ok('9 figure count matches api', count === json.figures.length, `${count} vs ${json.figures.length}`);

  await page.fill('input[aria-label="Search figures"]', 'Schreiner');
  await page.waitForTimeout(600);
  const cards = page.locator('li.card');
  ok('10 exactly one search result', (await cards.count()) === 1, await cards.count());
  ok('11 it is her', (await cards.first().innerText()).includes('Olive Schreiner'));

  const before = (await cards.first().boundingBox()).height;
  ok('12 card has real width', (await cards.first().boundingBox()).width > 250);
  await cards.first().locator('button').first().click();
  await page.waitForSelector('.prose-import', { timeout: 20000 });
  await page.waitForTimeout(800);
  const after = (await cards.first().boundingBox()).height;
  ok('13 expands to the full essay', after > before + 2000, `${before} -> ${after}`);

  const txt = await page.locator('.prose-import').innerText();
  for (const s of ['Thou hast well chosen', 'but the work lived', 'It is that he might leave you',
    'And he answered, \u201cIN THE FUTURE.\u201d', 'shape us to our cursed end',
    'The dying eyes on the pillow', 'He died holding it', 'what the name of the play is no one knows']) ok(`14 rendered text has ${s}`, txt.includes(s));
  ok('15 no stray html tags rendered', !/&lt;p|<p style/.test(txt));

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('16 no horizontal overflow at 390px', overflow <= 1, overflow);

  await page.screenshot({ path: '/home/kit/ledger/shots/fig53-schreiner.png', fullPage: false });
  ok('12 no console errors', errs.length === 0, errs.slice(0, 3).join(' | '));
} catch (e) {
  fail++; console.log('THREW', e.message);
} finally {
  await b.close();
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
