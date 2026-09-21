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
 const f=j.figures.find(x=>x.ordinal===80);
 out.apiStatus=api.status(); out.figure={ordinal:f&&f.ordinal,name:f&&(f.name||f.title),slug:f&&f.slug,chip:f&&f.chip_date}; out.total=j.figures.length;
 await p.goto(BASE+'/figures',{waitUntil:'networkidle'});
 await p.waitForSelector('input[aria-label="Search figures"]',{timeout:20000});
 await p.fill('input[aria-label="Search figures"]','Braddon'); await p.waitForTimeout(600);
 const cards=p.locator('li.card'); out.cardCount=await cards.count(); out.cardText=out.cardCount?await cards.first().innerText():'';
 if(out.cardCount){ await cards.first().locator('button').first().click(); await p.waitForSelector('.prose-import',{timeout:20000}); await p.waitForTimeout(800); const prose=await p.locator('.prose-import').innerText(); out.headings=await p.locator('.prose-import h4').allTextContents(); out.hasTheirWorks=/their works/i.test(prose); out.hasLadyAudley=/Lady Audley/i.test(prose); out.proseChars=prose.length; }
 out.overflow=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 out.consoleErrors=consoleErrors; out.pageErrors=pageErrors;
 await p.screenshot({path:'/home/kit/ledger/shots/fig80-live-mobile.png'});
}catch(e){out.threw=e.stack||String(e)}finally{await b.close()}
console.log(JSON.stringify(out,null,2));
