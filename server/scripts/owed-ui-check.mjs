import {createRequire} from 'module';
import fs from 'fs'; import {createHash,randomUUID} from 'crypto'; import assert from 'assert/strict'; import {execFileSync} from 'child_process';
const require=createRequire('/home/kit/package.json');const {chromium}=require('playwright');
createRequire('/home/kit/ledger/package.json')('dotenv').config({path:'/home/kit/ledger/.env',quiet:true});
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:'/home/kit/ledger',encoding:'utf8'}).trim();
const stamp=new Date().toISOString().replace(/[:.]/g,'-')+'-'+process.pid;
const log=[];function say(s){console.log(s);log.push(s)}
say('META sha='+sha+' stamp='+stamp);
const lockPath='/tmp/ledger-owed-verification.lock';
const lockFd=fs.openSync(lockPath,'wx',0o600);
const lockStat=fs.fstatSync(lockFd);
try {
 fs.writeFileSync(lockFd,JSON.stringify({pid:process.pid,suite:'owed-ui-4-cases',startedAt:new Date().toISOString(),sha})+'\n');
if(process.env.OWED_EXPECTED_SHA)assert.equal(sha,process.env.OWED_EXPECTED_SHA,'source SHA mismatch');
const html=fs.readFileSync('/home/kit/ledger/client/dist/index.html','utf8');
const localAsset=html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];assert(localAsset);
const digest=b=>createHash('sha256').update(b).digest('hex');
const localHash=digest(fs.readFileSync('/home/kit/ledger/client/dist'+localAsset));
for(const host of ['https://ledger-six-delta-88.vercel.app','https://warily-vigilantly-factual-catbird.kitten.space']){
 const r=await fetch(host+'/money',{cache:'no-store'});assert(r.ok);const markup=await r.text();const asset=markup.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];assert(asset,'missing JS');
 const js=await fetch(host+asset,{cache:'no-store'});assert(js.ok);const hash=digest(Buffer.from(await js.arrayBuffer()));say('ASSET '+host+' '+asset+' '+hash);
 assert.equal(asset,localAsset,'deployed asset differs');assert.equal(hash,localHash,'deployed asset hash differs');
}
say('PASS both hosts source dist asset hash '+localHash);
const browser=await chromium.launch({headless:true});
for (const host of ['https://ledger-six-delta-88.vercel.app','https://warily-vigilantly-factual-catbird.kitten.space']) for (const mobile of [false,true]) {
 const tag=(host.includes('vercel')?'vercel':'kitten')+'-'+(mobile?'mobile':'desktop'), prefix='/tmp/owed-'+stamp+'-'+tag, uid='UI '+stamp+' '+tag;
 const ids=new Set(), errors=[]; let own=null, baseline, finance, accounts, uiAccounts;
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900}});
 const p=await ctx.newPage(); p.setDefaultTimeout(18000);
 p.on('pageerror',e=>errors.push(e.message));
 p.on('response',async r=>{try{if(new URL(r.url()).pathname==='/api/owed' && r.request().method()==='POST' && r.status()===201){let j=await r.json();if(j.loan?.id)ids.add(j.loan.id)}}catch(e){errors.push('response capture '+e.message)}});
 const api=async(path,method='GET',body)=>p.evaluate(async({path,method,body})=>{const r=await fetch(path,{method,credentials:'same-origin',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const text=await r.text();let data;try{data=JSON.parse(text)}catch{}return {status:r.status,data}}, {path,method,body});
 const snap=async label=>{await p.screenshot({path:prefix+'-'+label+'.png',fullPage:false});say('SCREEN '+tag+' '+label+' '+prefix+'-'+label+'.png')};
 const by=id=>p.getByTestId(id);
 const settleDialog=async()=>{
  await p.getByRole('dialog').waitFor({state:'visible'});
  await p.evaluate(async()=>{
   const d=document.querySelector('[role=dialog]'), b=document.querySelector('.sheet-backdrop');
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const animations=[...d.getAnimations({subtree:true}),...(b?b.getAnimations({subtree:true}):[])].filter(a=>Number.isFinite(a.effect?.getComputedTiming().iterations));
   await Promise.race([Promise.all(animations.map(a=>a.finished.catch(()=>{}))),new Promise((_,reject)=>setTimeout(()=>reject(Error('dialog animations did not settle')),5000))]);
  });
 };
 const ensureScrolledBeforeOpen=async label=>{
  await p.evaluate(()=>window.scrollTo(0,250));
  const scroll=await p.evaluate(()=>({scrollY:window.scrollY,scrollingElement:document.scrollingElement?.tagName,scrollTop:document.scrollingElement?.scrollTop}));
  say('PREOPEN_SCROLL '+tag+' '+label+' '+JSON.stringify(scroll));
  assert(scroll.scrollY>0||scroll.scrollTop>0,'page must be scrolled before opening '+JSON.stringify(scroll));
 };

 const rapidToastRegression=async()=>{
  await p.waitForFunction(()=>{
   const texts=[...document.querySelectorAll('.toasts .toast')].map(e=>e.innerText);
   return texts.some(t=>t.includes('this payment changed elsewhere'))&&texts.some(t=>t.includes('Payment updated'));
  },null,{timeout:4000});
  await p.evaluate(async()=>{
   const area=document.querySelector('.toasts');
   await Promise.race([Promise.all(area.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{}))),new Promise((_,rej)=>setTimeout(()=>rej(Error('toast animation timeout')),3000))]);
  });
  const evidence=await p.evaluate(()=>{
   const sheet=document.querySelector('.owed-dialog [role=dialog]'),back=document.querySelector('.owed-dialog .sheet-backdrop'), area=document.querySelector('.toasts');
   const rect=e=>{let r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
   const intersect=(a,b)=>{let x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),right=Math.min(a.right,b.right),bottom=Math.min(a.bottom,b.bottom);return right>x&&bottom>y?{x,y,right,bottom,width:right-x,height:bottom-y}:null};
   const toasts=[...area.querySelectorAll('.toast')].map(e=>({text:e.innerText,rect:rect(e),dismiss:rect(e.querySelector('button[aria-label=Dismiss]'))}));
   const footer=[...sheet.querySelectorAll('.sheet-foot button')].map(e=>{let r=rect(e),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {text:e.innerText,rect:r,centerHits:!!hit&&(hit===e||e.contains(hit))}});
   const intersections=[];
   for(const t of toasts)for(const e of sheet.querySelectorAll('.sheet-foot button')){
    const intersection=intersect(t.dismiss,rect(e));if(!intersection)continue;
    const hit=document.elementFromPoint(intersection.x+intersection.width/2,intersection.y+intersection.height/2);
    intersections.push({toast:t.text,footer:e.innerText,rect:intersection,hitsFooter:!!hit&&(hit===e||e.contains(hit)),hitTag:hit?.tagName,hitLabel:hit?.getAttribute('aria-label')});
   }
   return {sheetZ:getComputedStyle(sheet).zIndex,backdropZ:getComputedStyle(back).zIndex,toastZ:getComputedStyle(area).zIndex,toasts,footer,intersections};
  });
  say('TOAST_GEOMETRY '+tag+' '+JSON.stringify(evidence));
  assert(Number(evidence.sheetZ)>Number(evidence.toastZ)&&Number(evidence.backdropZ)>Number(evidence.toastZ),'owed sheet/backdrop must outrank toasts');
  assert(evidence.footer.length>=3&&evidence.footer.every(x=>x.centerHits),'footer center is obstructed');
  if(mobile){
   const collision=evidence.intersections.filter(x=>x.toast.includes('Payment updated')&&x.footer==='Save');
   assert(collision.length>0,'regression did not exercise toast dismiss and Save overlap');
   assert(collision.every(x=>x.hitsFooter),'toast dismiss intercepts footer overlap point '+JSON.stringify(collision));
  }
  await snap('rapid-payment-toast-overlap');
  check('rapid payment conflict and success toasts remain below owed dialog, footer hit-tested');
 };
 const dialogGeometry=async(label,{mustScroll=false}={})=>{
  await settleDialog();
  const measure=async phase=>{
   const g=await p.evaluate(()=>{
    const d=document.querySelector('[role=dialog]'), back=document.querySelector('.sheet-backdrop');
    const head=d?.querySelector('.sheet-head'),foot=d?.querySelector('.sheet-foot'),body=d?.querySelector('.sheet-body');
    const rect=e=>{if(!e)return null;let r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
    const actions=[...d.querySelectorAll('.sheet-head button,.sheet-foot button')].filter(e=>e.getClientRects().length).map(e=>{
     const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
     return {name:e.getAttribute('aria-label')||e.innerText,rect:rect(e),hit:!!hit&&(hit===e||e.contains(hit)),visible:getComputedStyle(e).visibility==='visible'};
    });
    return {viewport:{width:innerWidth,height:innerHeight},scrollY,dialog:rect(d),backdrop:rect(back),head:rect(head),foot:rect(foot),body:rect(body),bodyScrollTop:body?.scrollTop,bodyScrollMax:body?.scrollHeight-body?.clientHeight,opacity:getComputedStyle(d).opacity,actions};
   });
   say('GEOMETRY '+tag+' '+label+' '+phase+' '+JSON.stringify(g));
   assert.equal(g.opacity,'1','dialog animation not finished');
   assert(g.dialog&&g.backdrop&&g.head&&g.foot&&g.body,'dialog parts missing');
   const t=1, v=g.viewport;
   assert(Math.abs(g.backdrop.x)<=t&&Math.abs(g.backdrop.y)<=t&&Math.abs(g.backdrop.right-v.width)<=t&&Math.abs(g.backdrop.bottom-v.height)<=t,'backdrop not viewport '+JSON.stringify(g.backdrop));
   for(const [name,r] of [['dialog',g.dialog],['head',g.head],['foot',g.foot]])
    assert(r.x>=-t&&r.y>=-t&&r.right<=v.width+t&&r.bottom<=v.height+t,name+' clipped '+JSON.stringify(r));
   assert(g.actions.length>=3,'missing header/footer controls');
   for(const a of g.actions)assert(a.visible&&a.hit&&a.rect.x>=-t&&a.rect.y>=-t&&a.rect.right<=v.width+t&&a.rect.bottom<=v.height+t&&a.rect.width>=43.5&&a.rect.height>=43.5,'inaccessible header/footer control '+JSON.stringify(a));
   return g;
  };
  const before=await measure('before-body-scroll');
  await p.locator('[role=dialog] .sheet-body').evaluate(e=>{e.scrollTop=e.scrollHeight});
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const after=await measure('after-body-scroll');
  if(mustScroll)assert(after.bodyScrollTop>1&&after.bodyScrollMax>1,'sheet did not actually scroll');
  for(const part of ['dialog','backdrop','head','foot'])for(const key of ['x','y','width','height'])
   assert(Math.abs(before[part][key]-after[part][key])<=1,part+' shifted while body scrolled');
  await snap(label+'-scrolled');
  await p.locator('[role=dialog] .sheet-body').evaluate(e=>{e.scrollTop=0});
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  check(label+' nonzero page scroll, viewport backdrop, fixed geometry and accessible controls');
 };

 const getLoan=async()=>{const r=await api('/api/owed/'+own);assert.equal(r.status,200);return r.data.loan};
 const waitLoan=async (pred)=>{for(let i=0;i<50;i++){let v=await getLoan();if(pred(v))return v;await p.waitForTimeout(200)}throw Error('loan state wait timeout')};
 const action=async (predicate,fn)=>{let [r]=await Promise.all([p.waitForResponse(r=>predicate(r),{timeout:30000}),fn()]);assert(r.ok(),'HTTP '+r.status()+' '+r.url());return r};
 const owedResp=(method,suffix)=>r=>r.request().method()===method&&new URL(r.url()).pathname===suffix;
 const screenMetrics=async label=>{let v=await p.evaluate(()=>{let root=document.documentElement, d=document.querySelector('[role=dialog]');let inputs=d?[...d.querySelectorAll('input,textarea')].map(e=>{let r=e.getBoundingClientRect(),par=e.parentElement.getBoundingClientRect();return {id:e.id,left:r.left,right:r.right,parentleft:par.left,parentright:par.right,width:r.width}}):[];let buttons=[...document.querySelectorAll('.owed-section button, [role=dialog] button')].filter(e=>e.getClientRects().length).map(e=>({label:e.innerText||e.getAttribute('aria-label'),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}));return {width:root.clientWidth,scrollWidth:root.scrollWidth,inputs,buttons}});say('METRICS '+tag+' '+label+' '+JSON.stringify(v));assert(v.scrollWidth<=v.width+1,'horizontal overflow');for(const x of v.inputs)assert(x.left>=x.parentleft-1&&x.right<=x.parentright+1,'input overflow '+JSON.stringify(x));for(const x of v.buttons)assert(x.height>=43.5&&x.width>=43.5,'SMALL '+tag+' '+label+' '+JSON.stringify(x))};
 const check=(label)=>say('PASS '+tag+' '+label);
 const checkTotal=async()=>{const a=(await api('/api/owed')).data;const displayed=await by('owed-total').innerText();const expected='₱'+(a.totalOutstandingCents/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});assert.equal(displayed.trim(),expected,'UI total versus current API total');};
 try{
   await p.goto(host+'/money',{waitUntil:'domcontentloaded',timeout:60000});
   await p.getByPlaceholder('••••••••').waitFor({state:'visible',timeout:30000});assert.equal((await api('/api/owed')).status,401);check('logged out lock and 401');
   await p.getByPlaceholder('••••••••').fill(process.env.LEDGER_PASSCODE);await p.getByRole('button',{name:'Unlock'}).click();
   await by('owed-new').waitFor({state:'visible',timeout:60000});await p.waitForFunction(()=>{let e=document.querySelector('[data-testid=owed-new]');return e&&!e.disabled},null,{timeout:60000});check('UI login and new component available');
   baseline=(await api('/api/owed')).data; assert(Array.isArray(baseline.loans)); finance=await api('/api/finance'); accounts=await api('/api/accounts'); assert.equal(finance.status,200);assert.equal(accounts.status,200);
   uiAccounts=await p.evaluate(()=>{let s=document.querySelector('[data-testid=owed-section]');return s?.previousElementSibling?.innerText});
   say('BASE '+tag+' loans='+baseline.loans.length+' outstandingCents='+baseline.totalOutstandingCents+' assets='+JSON.stringify(await p.locator('script[src]').evaluateAll(els=>els.map(x=>x.getAttribute('src')))));
   await by('owed-new').scrollIntoViewIfNeeded();await ensureScrolledBeforeOpen('new-loan');
   await by('owed-new').click();await dialogGeometry('new-loan');await snap('new-loan-settled');await screenMetrics('new-loan');
   await by('owed-name').fill(uid);await by('owed-amount').fill('1000.50');await by('owed-lent-date').fill('2026-11-20');await by('owed-due-date').fill('2026-12-20');await by('owed-notes').fill('fixture notes');
   const created=await action(owedResp('POST','/api/owed'),()=>by('owed-save').click());own=(await created.json()).loan.id;ids.add(own);await p.getByRole('dialog').waitFor({state:'hidden'});let loan=await getLoan();assert.equal(loan.amountCents,100050);assert.equal(loan.name,uid);assert.equal(loan.dueDate,'2026-12-20');assert.equal(loan.notes,'fixture notes');
   let list=(await api('/api/owed')).data;await checkTotal();check('create UI loan and total');
   let row=by('owed-loan-row').filter({hasText:uid});await row.scrollIntoViewIfNeeded();await ensureScrolledBeforeOpen('existing-loan');await snap('populated-list');await screenMetrics('list');let box=await row.boundingBox();await p.mouse.click(box.x+box.width-8,box.y+box.height-8);await by('owed-name').waitFor({state:'visible'});assert.equal(await by('owed-name').inputValue(),uid);await dialogGeometry('existing-loan',{mustScroll:true});await snap('sheet-metadata');await screenMetrics('sheet');
   await p.reload();await by('owed-new').waitFor({timeout:60000});row=by('owed-loan-row').filter({hasText:uid});await row.click();await by('owed-name').waitFor();assert.equal(await by('owed-amount').inputValue(),'1000.50');assert.equal(await by('owed-due-date').inputValue(),'2026-12-20');
   await by('owed-name').fill(uid+' edited');await by('owed-notes').fill('edited notes');await by('owed-due-date').fill('');await action(owedResp('PUT','/api/owed/'+own),()=>by('owed-save').click());await waitLoan(l=>l.name===uid+' edited'&&l.dueDate===null);await p.waitForFunction(()=>document.querySelector('[data-testid=owed-due-date]')?.value==='');assert.equal((await getLoan()).notes,'edited notes');
   await by('owed-due-date').fill('2026-12-20');await action(owedResp('PUT','/api/owed/'+own),()=>by('owed-save').click());await waitLoan(l=>l.dueDate==='2026-12-20');await by('owed-pay-amount').waitFor();check('bottom right click, reload, metadata edit and clear/restore due');
   // Deliberately leave metadata dirty, then save a payment and watch the UI refresh.
   await by('owed-notes').fill('unsaved draft notes');await by('owed-name').fill(uid+' dirty');await by('owed-due-date').fill('2026-12-22');
   await by('owed-pay-amount').fill('100.10');await by('owed-pay-date').fill('2026-11-21');await by('owed-pay-notes').fill('partial note');
   if(!mobile && host.includes('vercel')){
     let intercepted=false, originalOp, committedId;let release, reached;const gate=new Promise(r=>release=r), started=new Promise(r=>reached=r);
     await p.route('**/api/owed/'+own+'/payments',async(route)=>{
       if(intercepted||route.request().method()!=='POST')return route.continue();
       intercepted=true;originalOp=route.request().postDataJSON().operationId;
       const result=await route.fetch();assert.equal(result.status(),201);const j=await result.json();committedId=j.loan.payments.find(x=>x.amountCents===10010)?.id;assert(committedId);reached();await gate;await route.abort('failed');
     });
     await by('owed-pay-save').click();await started;
     try { for(const name of ['owed-pay-amount','owed-pay-date','owed-pay-notes','owed-pay-save','owed-name','owed-amount','owed-save'])assert(await by(name).isDisabled(),name+' must be disabled while busy');
     assert(await by('owed-delete').getByRole('button',{name:'Delete loan'}).isDisabled());assert(await by('owed-mark-paid').getByRole('button',{name:'Mark paid'}).isDisabled());check('payment fields and mutating actions disabled while pending'); } finally {release();}
     await p.getByRole('alert').first().waitFor();assert.equal(await by('owed-pay-amount').inputValue(),'100.10');assert.equal((await getLoan()).payments.filter(x=>x.amountCents===10010).length,1);
     const retry=await action(owedResp('POST','/api/owed/'+own+'/payments'),()=>by('owed-pay-save').click());assert.equal(retry.request().postDataJSON().operationId,originalOp);
     await p.unroute('**/api/owed/'+own+'/payments');loan=await waitLoan(l=>l.remainingCents===90040);assert.equal(loan.payments.length,1);assert.equal(loan.payments[0].id,committedId);check('lost response retry same operationId and exactly one payment');
   }else await action(owedResp('POST','/api/owed/'+own+'/payments'),()=>by('owed-pay-save').click());
   loan=await waitLoan(l=>l.remainingCents===90040);await p.getByTestId('owed-payment-row').filter({hasText:'100.10'}).waitFor();assert.equal(loan.status,'partial');await checkTotal();
   assert.equal(await by('owed-notes').inputValue(),'unsaved draft notes');assert.equal(await by('owed-name').inputValue(),uid+' dirty');assert.equal(await by('owed-due-date').inputValue(),'2026-12-22');assert.equal(loan.notes,'edited notes');check('dirty metadata preserved across internal refresh after payment');
   await action(owedResp('PUT','/api/owed/'+own),()=>by('owed-save').click());loan=await waitLoan(l=>l.notes==='unsaved draft notes'&&l.name===uid+' dirty'&&l.dueDate==='2026-12-22');check('intentional save persists previously dirty metadata');
   await by('owed-notes').fill('metadata conflict draft');let current=await getLoan();
   const external=await api('/api/owed/'+own,'PUT',{name:current.name,amount:current.amount,lentDate:current.lentDate,dueDate:current.dueDate,notes:'remote notes',version:current.version});assert.equal(external.status,200);
   let [conflict]=await Promise.all([p.waitForResponse(owedResp('PUT','/api/owed/'+own)),by('owed-save').click()]);assert.equal(conflict.status(),409);await p.getByRole('alert').filter({hasText:'this loan changed elsewhere'}).first().waitFor();
   assert.equal(await by('owed-notes').inputValue(),'metadata conflict draft');await p.waitForFunction(()=>!document.querySelector('[data-testid=owed-save]').disabled);await action(owedResp('PUT','/api/owed/'+own),()=>by('owed-save').click());loan=await waitLoan(l=>l.notes==='metadata conflict draft');check('metadata 409 retains draft and retry saves');
   await by('owed-notes').fill('edited notes');await by('owed-name').fill(uid+' edited');await by('owed-due-date').fill('2026-12-20');await action(owedResp('PUT','/api/owed/'+own),()=>by('owed-save').click());await waitLoan(l=>l.notes==='edited notes'&&l.dueDate==='2026-12-20');check('partial payment and total 900.40');
   await by('owed-payment-row').filter({hasText:'100.10'}).getByRole('button',{name:/Edit payment/}).click();await by('owed-pay-amount').fill('200.20');await by('owed-pay-date').fill('2026-11-22');await by('owed-pay-notes').fill('edited payment');
   let pre=await getLoan();let bump=await api('/api/owed/'+own,'PUT',{name:pre.name,amount:pre.amount,lentDate:pre.lentDate,dueDate:pre.dueDate,notes:'external payment conflict',version:pre.version});assert.equal(bump.status,200);
   let [payConflict]=await Promise.all([p.waitForResponse(r=>r.request().method()==='PUT'&&new URL(r.url()).pathname.startsWith('/api/owed/'+own+'/payments/')),by('owed-pay-save').click()]);assert.equal(payConflict.status(),409);await p.getByRole('alert').filter({hasText:'this payment changed elsewhere'}).first().waitFor();assert.equal(await by('owed-pay-amount').inputValue(),'200.20');assert.equal(await by('owed-pay-notes').inputValue(),'edited payment');await p.waitForFunction(()=>!document.querySelector('[data-testid=owed-pay-save]').disabled);
   await action(r=>r.request().method()==='PUT'&&new URL(r.url()).pathname.startsWith('/api/owed/'+own+'/payments/'),()=>by('owed-pay-save').click());check('payment edit 409 retains draft and retry saves');await rapidToastRegression();loan=await waitLoan(l=>l.remainingCents===80030);await by('owed-payment-row').filter({hasText:'200.20'}).waitFor();assert.equal(loan.payments[0].notes,'edited payment');assert.equal(loan.payments[0].paidDate,'2026-11-22');await by('owed-payment-row').scrollIntoViewIfNeeded();await snap('sheet-payments');await screenMetrics('payments');check('edit payment and remaining 800.30');
   let reject=await api('/api/owed/'+own+'/payments','POST',{amount:'900.00',paidDate:'2026-11-23',notes:'overpay',operationId:randomUUID()});assert.equal(reject.status,400);assert.equal((await getLoan()).remainingCents,80030);
   await by('owed-pay-amount').fill('900.00');await by('owed-pay-date').fill('2026-11-23');await by('owed-pay-notes').fill('overpay');await by('owed-pay-save').click();await p.getByRole('alert').filter({hasText:'payment cannot exceed'}).first().waitFor();assert.equal((await getLoan()).remainingCents,80030);check('API and UI overpayment rejected unchanged');
   let mark=by('owed-mark-paid');await mark.getByRole('button',{name:'Mark paid'}).click();await action(owedResp('POST','/api/owed/'+own+'/settle'),()=>mark.getByRole('button',{name:/Pay/}).click());loan=await waitLoan(l=>l.status==='paid');await p.getByText('Fully paid',{exact:true}).waitFor();assert.equal(loan.remainingCents,0);assert.equal(loan.payments.length,2);let settlement=loan.payments.find(x=>x.notes==='Marked paid');assert.equal(settlement.amountCents,80030);assert.equal(settlement.paidDate,baseline.today);await checkTotal();await by('owed-payment-row').first().scrollIntoViewIfNeeded();await snap('paid-history');check('settle records today payment and paid history');
   let settledRow=by('owed-payment-row').filter({hasText:'800.30'});await settledRow.getByRole('button',{name:'Delete',exact:true}).click();await action(r=>r.request().method()==='DELETE'&&new URL(r.url()).pathname.endsWith('/payments/'+settlement.id),()=>settledRow.getByRole('button',{name:'Sure?'}).click());loan=await waitLoan(l=>l.remainingCents===80030);assert.equal(loan.status,'partial');assert.equal(loan.payments.length,1);await by('owed-pay-amount').waitFor();check('delete settlement reopens partial');
   await by('owed-notes').fill('edited notes');await by('owed-amount').fill('1200.50');await action(owedResp('PUT','/api/owed/'+own),()=>by('owed-save').click());loan=await waitLoan(l=>l.amountCents===120050);assert.equal(loan.remainingCents,100030);assert.equal(loan.notes,'edited notes');assert.equal(loan.dueDate,'2026-12-20');await p.reload();await by('owed-new').waitFor({timeout:60000});await by('owed-loan-row').filter({hasText:uid}).click();await by('owed-amount').waitFor();assert.equal(await by('owed-amount').inputValue(),'1200.50');assert.equal(await by('owed-notes').inputValue(),'edited notes');check('principal edit and reload persistence');
   const del=by('owed-delete');await del.getByRole('button',{name:'Delete loan'}).click();await action(owedResp('DELETE','/api/owed/'+own),()=>del.getByRole('button',{name:'Sure?'}).click());await p.getByRole('dialog').waitFor({state:'hidden'});assert.equal((await api('/api/owed/'+own)).status,404);assert.equal((await api('/api/owed')).data.loans.filter(x=>x.id===own).length,0);ids.delete(own);check('delete loan UI and 404');
   const postFinance=await api('/api/finance'),postAccounts=await api('/api/accounts');assert.deepEqual(postAccounts.data,accounts.data);assert.deepEqual(postFinance.data,finance.data);let uiAfter=await p.evaluate(()=>document.querySelector('[data-testid=owed-section]')?.previousElementSibling?.innerText);assert.equal(uiAfter,uiAccounts);check('accounts and finance API plus adjacent UI unchanged');
   await by('owed-section').scrollIntoViewIfNeeded();await snap('postcleanup');await screenMetrics('postcleanup');assert.equal(errors.length,0,errors.join('; '));check('no page JavaScript errors');
 }catch(e){say('FATAL '+tag+' '+e.stack)}
 finally{
  for(const id of ids){try{let before=await api('/api/owed/'+id);if(before.status===200){let d=await api('/api/owed/'+id,'DELETE');if(d.status!==200)throw Error('delete '+d.status)}let verify=await api('/api/owed/'+id);if(verify.status!==404)throw Error('verify '+verify.status);say('CLEAN '+tag+' '+id+' verified404')}catch(e){say('CLEANFAIL '+tag+' '+id+' '+e.message)}}
  try{let lock=await api('/api/auth/lock','POST',{});let verify=await api('/api/owed');if(lock.status!==200||verify.status!==401)throw Error('lock='+lock.status+' verify='+verify.status);say('LOCK '+tag+' '+lock.status+' verify '+verify.status)}catch(e){say('LOCKFAIL '+tag+' '+e.message)}
  await ctx.close();
 }
}
await browser.close();fs.writeFileSync('/tmp/owed-ui-'+stamp+'.log',log.join('\n')+'\n');process.exitCode=log.some(x=>/^(FATAL|FAIL|CLEANFAIL|LOCKFAIL)/.test(x))?1:0;

} finally {
  fs.closeSync(lockFd);
  const stat=fs.lstatSync(lockPath,{throwIfNoEntry:false});
  if(stat && stat.dev===lockStat.dev && stat.ino===lockStat.ino)fs.unlinkSync(lockPath);
}
