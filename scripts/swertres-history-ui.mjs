#!/usr/bin/env node
import assert from 'node:assert/strict';
import { chromium } from '/home/kit/node_modules/playwright/index.mjs';
import { env } from '../server/src/lib/env.js';
const bases=process.argv.slice(2);
if(!bases.length)throw Error('Pass the actual deployment URLs');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const base of bases)for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
  const unauth=await context.request.get(base+'/api/swertres');assert.equal(unauth.status(),401);
  const auth=await context.request.post(base+'/api/auth/unlock',{data:{passcode:env.LEDGER_PASSCODE}});assert.equal(auth.status(),200);
  const response=await context.request.get(base+'/api/swertres');assert.equal(response.status(),200);
  assert.match(response.headers()['cache-control'],/no-store/);
  const data=await response.json();assert.equal(data.history.length,4);
  assert.deepEqual(data.picks.map(p=>p.combo).sort(),['0-7-4','1-4-4','1-8-2','9-4-6'].sort());
  assert.ok(data.picks.every(p=>p.draw_time==='17:00'&&p.outcome.status==='pending'));
  assert.equal(data.results.filter(r=>r.officialVerified).length,366);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base+'/swertres',{waitUntil:'networkidle'});
  const section=page.locator('section[aria-labelledby="sw-hist"]');
  await section.waitFor();assert.equal(await section.locator('li.card').count(),4);
  assert.equal(await section.getByText(/Not counted as a miss/).count(),4);
  await section.scrollIntoViewIfNeeded();
  const shot='/tmp/swertres-history-'+(base.includes('vercel')?'vercel':'kitten')+'-'+width+'.png';
  await page.screenshot({path:shot});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const current=await page.locator('script[src]').getAttribute('src');
  assert.ok((await page.locator('section[aria-labelledby="sw-draws"]').innerText()).includes('official PCSO'));
  const older=page.getByRole('button',{name:/Show older results/});await older.click();
  assert.equal(await page.locator('section[aria-labelledby="sw-draws"] li').count(),39);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({base,width,script:current,history:4,pending:4,verified:366,olderResults:39,screenshot:shot,errors}));
  await context.request.post(base+'/api/auth/lock');await context.close();
 }
}finally{await browser.close();}
