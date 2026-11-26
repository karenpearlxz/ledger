import {createRequire} from 'module';
import assert from 'assert/strict';
import fs from 'fs';
const req=createRequire('/home/kit/ledger/package.json'),{chromium}=createRequire('/home/kit/package.json')('playwright');req('dotenv').config({path:'/home/kit/ledger/.env',quiet:true});
const sharp=req('sharp'),png=await sharp({create:{width:80,height:60,channels:3,background:'#627b73'}}).png().toBuffer();
const logs=[];function log(s){console.log(s);logs.push(s)}
const browser=await chromium.launch({headless:true});
for(const host of ['https://warily-vigilantly-factual-catbird.kitten.space','https://ledger-six-delta-88.vercel.app'])for(const mode of ['desktop','mobile']){
const tag=(host.includes('vercel')?'vercel':'kitten')+' '+mode,stamp=Date.now().toString(36)+Math.random().toString(36).slice(2,7),posts=new Set(),images=new Set();
const c=await browser.newContext({viewport:mode==='mobile'?{width:390,height:844}:{width:1440,height:900},userAgent:'LedgerRaceTest/'+stamp,permissions:['clipboard-read','clipboard-write']});
const p=await c.newPage();p.on('dialog',d=>d.accept());p.on('response',async r=>{try{const u=new URL(r.url());if(r.status()===201&&r.request().method()==='POST'&&u.pathname==='/api/blog'){const j=await r.json();posts.add(j.post.id)}if(r.status()===201&&r.request().method()==='POST'&&u.pathname==='/api/blog/images'){const j=await r.json();images.add(j.id)}}catch{}});
const api=async(path,method='GET',data)=>p.evaluate(async({path,method,data})=>{const r=await fetch(path,{method,headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});let text=await r.text();let j;try{j=JSON.parse(text)}catch{};return{status:r.status,data:j}}, {path,method,data});
const test=async(name,f)=>{try{await f();log('PASS '+tag+' '+name)}catch(e){log('FAIL '+tag+' '+name+' '+String(e.stack).slice(0,900))}};
const clean=async()=>p.waitForFunction(()=>document.querySelector('[data-testid=blog-save-state]')?.dataset.state==='clean',null,{timeout:30000});
const gotoBlog=async()=>{await p.goto(host+'/blog',{waitUntil:'domcontentloaded'});await p.getByTestId('blog-list').waitFor({timeout:25000})};
try{
 await p.goto(host+'/blog',{waitUntil:'domcontentloaded'});await p.getByPlaceholder('••••••••').waitFor({timeout:20000});assert.equal((await api('/api/blog')).status,401);
 assert.equal((await api('/api/auth/unlock','POST',{passcode:process.env.LEDGER_PASSCODE})).status,200);await gotoBlog();
 await test('old pending editor cannot erase new editor recovery',async()=>{
  await p.getByTestId('blog-new').click();await p.getByTestId('blog-editor').waitFor();
  let releaseA,releaseB,seenA,seenB;const gateA=new Promise(r=>releaseA=r),gateB=new Promise(r=>releaseB=r),gotA=new Promise(r=>seenA=r),gotB=new Promise(r=>seenB=r);
  let count=0;const handler=async route=>{if(route.request().method()!=='POST'){await route.continue();return}count++;if(count===1){seenA();await gateA}else if(count===2){seenB();await gateB}await route.continue()};
  await p.route('**/api/blog',handler);
  try{
   await p.getByTestId('blog-title').fill('old owner '+stamp);await gotA;
   await p.getByTestId('blog-editor').click();await p.keyboard.insertText('OLD EXTRA '+stamp);
   await p.locator('a[href="/notes"]:visible').first().click();await p.waitForURL('**/notes');
   await p.locator('a[href="/blog"]:visible').first().click();await p.getByTestId('blog-new').click();await p.getByTestId('blog-editor').waitFor();
   const newTitle='new owner '+stamp;await p.getByTestId('blog-title').fill(newTitle);await p.getByTestId('blog-editor').click();await p.keyboard.insertText('NEW RECOVERY '+stamp);await p.keyboard.press('Control+s');await gotB;
   const oldResponse=p.waitForResponse(r=>r.url()===host+'/api/blog'&&r.request().method()==='POST'&&r.status()===201&&r.request().postDataJSON().title.startsWith('old owner '),{timeout:30000});
   const put=p.waitForResponse(r=>r.request().method()==='PUT'&&r.url().startsWith(host+'/api/blog/')&&r.status()===200,{timeout:30000});
   releaseA();const old=await oldResponse;posts.add((await old.json()).post.id);await put;
   const newDraft=await p.evaluate(()=>JSON.parse(sessionStorage.getItem('ledger:blog-draft:new')||'null'));assert.equal(newDraft?.form?.title,newTitle,JSON.stringify(newDraft));assert(newDraft.form.html.includes('NEW RECOVERY'));
   releaseB();await p.waitForURL(u=>u.pathname.startsWith('/blog/')&&u.pathname!=='/blog/new',{timeout:30000});let id=p.url().split('/').pop();posts.add(id);await clean();const post=(await api('/api/blog/'+id)).data.post;assert.equal(post.title,newTitle);assert(post.html.includes('NEW RECOVERY'));
  } finally {releaseA();releaseB();await p.unroute('**/api/blog',handler)}
 });
 await test('first POST delayed, edit body and slug, navigate away, all persisted',async()=>{
  await gotoBlog();
  await p.getByTestId('blog-new').click();await p.getByTestId('blog-editor').waitFor();
  let release,captured;const gate=new Promise(r=>release=r),seen=new Promise(r=>captured=r);
  const handler=async route=>{if(route.request().method()==='POST'){captured();await gate;await route.continue()}else await route.continue()};
  await p.route('**/api/blog',handler);
  await p.getByTestId('blog-title').fill('race '+stamp);await seen;
  await p.getByTestId('blog-slug').fill('race-slug-'+stamp);
  await p.getByTestId('blog-editor').click();await p.keyboard.insertText('RACE CONTENT '+stamp);
  const response=p.waitForResponse(r=>r.url()===host+'/api/blog'&&r.request().method()==='POST'&&r.status()===201,{timeout:30000});
  const notes=p.locator('a[href="/notes"]:visible').first();await notes.click();await p.waitForURL('**/notes');
  release();const res=await response;const id=(await res.json()).post.id;posts.add(id);await p.unroute('**/api/blog',handler);
  await p.waitForFunction(async({id,slug,body})=>{let r=await fetch('/api/blog/'+id);let j=await r.json();return j?.post?.slug===slug&&j?.post?.html?.includes(body)}, {id,slug:'race-slug-'+stamp,body:'RACE CONTENT '+stamp},{timeout:30000});
 });
 await test('late cover survives first autosave assigning id',async()=>{
  await gotoBlog();await p.getByTestId('blog-new').click();await p.getByTestId('blog-editor').waitFor();
  let release,captured;const gate=new Promise(r=>release=r),seen=new Promise(r=>captured=r);
  const handler=async route=>{if(route.request().method()==='POST'){captured();await gate;await route.continue()}else await route.continue()};
  await p.route('**/api/blog/images',handler);
  await p.getByTestId('blog-cover-input').setInputFiles({name:'race.png',mimeType:'image/png',buffer:png});await seen;
  await p.getByTestId('blog-title').fill('late cover '+stamp);await p.waitForURL(u=>u.pathname.startsWith('/blog/') && u.pathname !== '/blog/new',{timeout:30000});
  let id=p.url().split('/').pop();posts.add(id);
  const imageResponse=p.waitForResponse(r=>r.url()===host+'/api/blog/images'&&r.request().method()==='POST'&&r.status()===201,{timeout:30000});
  release();const ir=await imageResponse;images.add((await ir.json()).id);await p.unroute('**/api/blog/images',handler);
  await p.getByTestId('blog-cover-img').waitFor({timeout:30000});await clean();
  const stored=(await api('/api/blog/'+id)).data.post;assert(stored.coverImage.startsWith('/api/blog/images/'));assert(await p.getByTestId('blog-cover-img').evaluate(i=>i.complete&&i.naturalWidth>0));
 });
 await test('offline metadata-only recovery',async()=>{
  await clean();let id=p.url().split('/').pop();await c.setOffline(true);
  await p.getByTestId('blog-date').fill('2026-10-25');await p.getByTestId('blog-slug').fill('recover-'+stamp);await p.getByTestId('blog-status').selectOption('published');
  await p.waitForFunction(()=>document.querySelector('[data-testid=blog-save-state]')?.dataset.state==='offline',null,{timeout:15000});
  await c.setOffline(false);await p.reload({waitUntil:'domcontentloaded'});await p.getByTestId('blog-restore').waitFor({timeout:25000});
  await p.getByRole('button',{name:'Restore them'}).click();assert.equal(await p.getByTestId('blog-date').inputValue(),'2026-10-25');assert.equal(await p.getByTestId('blog-slug').inputValue(),'recover-'+stamp);assert.equal(await p.getByTestId('blog-status').inputValue(),'published');await clean();
  let post=(await api('/api/blog/'+id)).data.post;assert.equal(post.slug,'recover-'+stamp);assert.equal(post.postDate,'2026-10-25');assert.equal(post.status,'published');
 });
 await test('native beforeprint and real clipboard Ctrl V',async()=>{
  const ed=p.getByTestId('blog-editor');await ed.click();await p.evaluate(async()=>navigator.clipboard.writeText('CLIPBOARD REAL TEXT'));await p.keyboard.press('Control+v');await p.waitForFunction(()=>document.querySelector('[data-testid=blog-editor]')?.innerText.includes('CLIPBOARD REAL TEXT'),null,{timeout:10000});
  await p.evaluate(()=>{document.querySelector('.blog-print').replaceChildren();window.dispatchEvent(new Event('beforeprint'))});
  let t=await p.locator('.blog-print').innerText();assert(t.includes('late cover '+stamp),t);assert(t.includes('CLIPBOARD REAL TEXT'),t);await clean();
 });
 await test('viewport toolbar and navigation screenshot',async()=>{
  await p.getByTestId('blog-toolbar').scrollIntoViewIfNeeded();
  const prefix='/tmp/ledger-race-'+tag.replace(' ','-');await p.screenshot({path:prefix+'-toolbar.png'});
  let data=await p.evaluate(()=>{const t=document.querySelector('[data-testid=blog-toolbar]'),a=[...t.querySelectorAll('button')];return {viewport:[innerWidth,innerHeight],toolbar:{w:t.clientWidth,scrollWidth:t.scrollWidth,pos:getComputedStyle(t).position},buttons:a.map(x=>({label:x.getAttribute('aria-label'),text:x.innerText,font:getComputedStyle(x).fontFamily}))}});log('VISUAL '+tag+' '+JSON.stringify(data));
 });
}catch(e){log('FATAL '+tag+' '+String(e.stack).slice(0,900))}
finally{await c.setOffline(false).catch(()=>{});await p.unrouteAll({behavior:'ignoreErrors'}).catch(()=>{});if(p.url().startsWith(host)){for(const id of posts){try{let r=await api('/api/blog/'+id,'DELETE');log('CLEAN post '+tag+' '+id+' '+r.status)}catch(e){log('CLEANFAIL '+id+' '+e.message)}}for(const id of images){try{let r=await api('/api/blog/images/'+id,'DELETE');log('CLEAN image '+tag+' '+id+' '+r.status)}catch(e){log('CLEANFAIL '+id+' '+e.message)}}try{let l=await api('/api/auth/lock','POST');let v=await api('/api/blog');log('LOCK '+tag+' '+l.status+' verify '+v.status)}catch(e){log('LOCKFAIL '+tag+' '+e.message)}}await c.close()}
}
await browser.close();fs.writeFileSync('/tmp/ledger-race-check.log',logs.join('\n')+'\n');

process.exitCode=logs.some(s=>/^(FAIL|FATAL|CLEANFAIL|LOCKFAIL)/.test(s))?1:0;
