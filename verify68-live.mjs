import { chromium } from '/home/kit/node_modules/playwright/index.mjs';
const BASE='https://warily-vigilantly-factual-catbird.kitten.space';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const p=await ctx.newPage();
const consoleErrors=[], pageErrors=[];
p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
p.on('pageerror',e=>pageErrors.push(String(e)));
let out={};
try{
 await p.goto(BASE,{waitUntil:'networkidle'});
 await p.fill('#passcode','dandan2020'); await p.press('#passcode','Enter');
 await p.waitForSelector('nav[aria-label="Sections"]:visible',{timeout:20000});
 const api=await p.request.get(BASE+'/api/content/figures'); const j=await api.json();
 const f=j.figures.find(x=>x.ordinal===68 || /Mary Elizabeth Coleridge/i.test(x.name||x.title||''));
 out.apiStatus=api.status(); out.figure=f; out.total=j.figures.length;
 await p.goto(BASE+'/figures',{waitUntil:'networkidle'});
 await p.waitForSelector('input[aria-label="Search figures"]',{timeout:20000});
 await p.fill('input[aria-label="Search figures"]','Mary Elizabeth Coleridge'); await p.waitForTimeout(500);
 const cards=p.locator('li.card'); out.cardCount=await cards.count(); out.cardText=out.cardCount?await cards.first().innerText():'';
 if(out.cardCount){ const before=await cards.first().boundingBox(); await cards.first().locator('button').first().click(); await p.waitForSelector('.prose-import',{timeout:20000}); await p.waitForTimeout(800); const after=await cards.first().boundingBox(); const prose=await p.locator('.prose-import').innerText(); out.opened=after.height>before.height; out.beforeHeight=before.height; out.afterHeight=after.height; out.headings=await p.locator('.prose-import h1,.prose-import h2,.prose-import h3,.prose-import h4').allTextContents(); out.hasTheirWorks=/their works/i.test(prose); out.proseChars=prose.length; }
 out.overflow=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 out.consoleErrors=consoleErrors; out.pageErrors=pageErrors; out.url=p.url();
 await p.screenshot({path:'/home/kit/ledger/shots/fig68-live-mobile.png'});
}catch(e){out.threw=e.stack||String(e)}finally{await b.close()}
console.log(JSON.stringify(out,null,2));
