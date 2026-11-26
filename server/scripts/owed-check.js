import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createApp} from '../src/app.js';
import {env} from '../src/lib/env.js';
import {getPool,closePool} from '../src/lib/db.js';

const baselinePath=process.env.OWED_BASELINE;
if(!baselinePath)throw Error('OWED_BASELINE full backup is required');
const backup=JSON.parse(await fs.readFile(baselinePath,'utf8'));
const lockPath='/tmp/ledger-owed-verification.lock';
const lock=await fs.open(lockPath,'wx',0o600).catch(()=>{throw Error('another Owed verification owns '+lockPath+'. Do not overlap API or UI suites; inspect the owner before clearing a stale lock.')});
const lockStat=await lock.stat();
await lock.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString(),suite:'api',base:process.env.BASE_URL||'local'}));
let server, cookie='',checks=0; const ids=new Set(), creationBodies=new Map();
const base=process.env.BASE_URL || await new Promise(resolve=>{server=createApp().listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port))});
const log=s=>console.log(s);
async function req(path,method='GET',body,headers={}){
 if(method==='POST'&&/^\/owed\/[^/]+\/payments$/.test(path)&&body&&!body.operationId)body={...body,operationId:crypto.randomUUID()};
 const response=await fetch(base+'/api'+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{}
 return {status:response.status,data,response,text};
}
async function check(name,fn){await fn();checks++;log('PASS '+name)}
const body=(name,amount='1000.50')=>({name,amount,operationId:crypto.randomUUID(),lentDate:'2026-11-20',dueDate:'2026-12-20',notes:'owned test fixture'});
const get=async id=>(await req('/owed/'+id)).data.loan;
const save=async loan=>req('/owed/'+loan.id,'PUT',{name:loan.name,amount:loan.amount,lentDate:loan.lentDate,dueDate:loan.dueDate,notes:loan.notes,version:loan.version});
async function add(name,amount){const b=body(name,amount);const replies=await Promise.all([req('/owed','POST',b),req('/owed','POST',b)]);for(const r of replies)if(r.data?.loan?.id)ids.add(r.data.loan.id);const r=replies[0];assert.equal(r.status,201,r.text);assert.equal(replies[1].status,201,replies[1].text);assert.equal(replies[1].data.loan.id,r.data.loan.id);creationBodies.set(r.data.loan.id,b);return r.data.loan}
try{
 log('META '+new Date().toISOString()+' '+base);
 await check('logged out data and writes require authentication',async()=>{for(const [p,m,b]of [['/owed','GET'],['/owed','POST',body('anonymous')],['/owed/00000000-0000-4000-8000-000000000000','DELETE']])assert.equal((await req(p,m,b)).status,401)});
 const login=await req('/auth/unlock','POST',{passcode:env.LEDGER_PASSCODE});assert.equal(login.status,200,login.text);cookie=login.response.headers.get('set-cookie').split(';')[0];
 const initial=await req('/owed');assert.equal(initial.status,200,initial.text);const originalLoans=initial.data.loans,initialTotal=initial.data.totalOutstandingCents;
 await check('private responses are not cached and use Manila date',async()=>{assert.match(initial.response.headers.get('cache-control'),/no-store/);assert.match(initial.data.today,/^\d{4}-\d{2}-\d{2}$/)});
 await check('cross-origin and cross-site writes are refused',async()=>{assert.equal((await req('/owed','POST',body('cross origin'),{Origin:'https://evil.example'})).status,403);assert.equal((await req('/owed','POST',body('cross site'),{'Sec-Fetch-Site':'cross-site'})).status,403)});
 await check('invalid amounts and genuine calendar dates are validated',async()=>{
  for(const amount of ['0','-1','0.001','NaN','1e2','100000000','',0.1])assert.equal((await req('/owed','POST',body('invalid',amount))).status,400,String(amount));
  for(const extra of [{name:''},{lentDate:'2026-02-30'},{dueDate:'2026-01-01'},{dueDate:'nonsense'},{notes:'x'.repeat(4001)},{unexpected:true}])assert.equal((await req('/owed','POST',{...body('invalid'),...extra})).status,400,JSON.stringify(extra).slice(0,100));
 });
 let loan=await add('Owed API fixture '+Date.now()),other=await add('Other fixture '+Date.now(),'100.00');
 await check('create returns every field, zero payments and exact remaining',async()=>{assert.equal(loan.amountCents,100050);assert.equal(loan.remaining,'1000.50');assert.equal(loan.status,'outstanding');assert.equal(loan.payments.length,0);assert.equal(loan.lentDate,'2026-11-20')});
 await check('loan creation retries are idempotent and reject changed payloads',async()=>{
  const b=creationBodies.get(loan.id),r=await req('/owed','POST',b);assert.equal(r.status,201,r.text);assert.equal(r.data.loan.id,loan.id);assert.equal((await req('/owed','POST',{...b,name:b.name+' different'})).status,409);
 });
 await check('metadata edits persist and optimistic versions protect concurrent edits',async()=>{
  let r=await save({...loan,name:loan.name+' edited',notes:'<script>alert(1)</script> plain text',dueDate:null});assert.equal(r.status,200,r.text);assert.equal(r.data.loan.dueDate,null);assert.equal(r.data.loan.notes,'<script>alert(1)</script> plain text');
  assert.equal((await save(loan)).status,409);loan=r.data.loan;
  const results=await Promise.all([save({...loan,notes:'writer one'}),save({...loan,notes:'writer two'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);loan=await get(loan.id);
 });
 let payment;const partialBody={amount:'100.10',paidDate:'2026-11-21',notes:'partial',operationId:crypto.randomUUID()};
 await check('partial repayments keep exact centavos and update totals',async()=>{
  const replies=await Promise.all([req('/owed/'+loan.id+'/payments','POST',partialBody),req('/owed/'+loan.id+'/payments','POST',partialBody)]);const r=replies[0];assert.equal(r.status,201,r.text);assert.equal(replies[1].status,201,replies[1].text);assert.equal(replies[1].data.loan.payments.length,1);loan=r.data.loan;payment=loan.payments[0];assert.equal(loan.remainingCents,90040);assert.equal(loan.paid,'100.10');assert.equal(loan.status,'partial');assert.equal((await req('/owed')).data.totalOutstandingCents,initialTotal+100050+10000-10010);
 });
 await check('payment retries do not double count and changed or cross-loan operations are refused',async()=>{
  const r=await req('/owed/'+loan.id+'/payments','POST',partialBody);assert.equal(r.status,201,r.text);assert.equal(r.data.loan.payments.length,1);assert.equal(r.data.loan.version,loan.version);assert.equal((await req('/owed/'+loan.id+'/payments','POST',{...partialBody,amount:'100.11'})).status,409);assert.equal((await req('/owed/'+other.id+'/payments','POST',partialBody)).status,409);
 });
 await check('overpayment, payment before loan, and principal below repaid amount are refused',async()=>{
  const p='/owed/'+loan.id+'/payments';for(const b of [{amount:'900.41',paidDate:'2026-11-21'},{amount:'1.00',paidDate:'2026-11-19'},{amount:'1.001',paidDate:'2026-11-21'}])assert.equal((await req(p,'POST',b)).status,400);
  assert.equal((await save({...loan,amount:'100.09'})).status,400);assert.equal((await save({...loan,lentDate:'2026-11-22'})).status,400);
 });
 await check('payment edits are exact and scoped to their own loan',async()=>{
  const p='/owed/'+loan.id+'/payments/'+payment.id;assert.equal((await req('/owed/'+other.id+'/payments/'+payment.id,'PUT',{amount:'1.00',paidDate:'2026-11-21',version:other.version})).status,404);assert.equal((await req('/owed/'+other.id+'/payments/'+payment.id,'DELETE')).status,404);
  const r=await req(p,'PUT',{amount:'200.20',paidDate:'2026-11-22',notes:'corrected',version:loan.version});assert.equal(r.status,200,r.text);const oldVersion=loan.version;loan=r.data.loan;assert.equal((await req(p,'PUT',{amount:'300.30',paidDate:'2026-11-22',notes:'stale',version:oldVersion})).status,409);assert.equal(loan.remaining,'800.30');assert.equal(loan.payments[0].notes,'corrected');
 });
 await check('mark paid validates the displayed balance and records a real remaining payment',async()=>{
  const p='/owed/'+loan.id+'/settle';assert.equal((await req(p,'POST',{paidDate:'2026-11-23',expectedRemainingCents:80029})).status,409);
  let r=await req(p,'POST',{paidDate:'2026-11-23',expectedRemainingCents:80030,notes:'settlement'});assert.equal(r.status,200,r.text);loan=r.data.loan;assert.equal(loan.remaining,'0.00');assert.equal(loan.status,'paid');assert.equal(loan.payments.length,2);assert.equal(loan.payments.find(p=>p.notes==='settlement').amount,'800.30');
  r=await req(p,'POST',{paidDate:'2026-11-23',expectedRemainingCents:80030});assert.equal(r.status,200);assert.equal(r.data.loan.payments.length,2);
 });
 await check('removing a payment reopens a settled loan automatically',async()=>{
  const p=loan.payments.find(p=>p.notes==='settlement');const r=await req('/owed/'+loan.id+'/payments/'+p.id,'DELETE');assert.equal(r.status,200,r.text);loan=r.data.loan;assert.equal(loan.remaining,'800.30');assert.equal(loan.status,'partial');
 });
 await check('concurrent partial payments cannot overpay',async()=>{
  const p='/owed/'+other.id+'/payments';const results=await Promise.all([req(p,'POST',{amount:'70.00',paidDate:'2026-11-21'}),req(p,'POST',{amount:'70.00',paidDate:'2026-11-21'})]);assert.deepEqual(results.map(r=>r.status).sort(),[201,400]);const current=await get(other.id);assert.equal(current.remaining,'30.00');assert.equal(current.payments.length,1);
 });
 await check('missing and malformed IDs return 404 without server errors',async()=>{assert.equal((await req('/owed/not-a-uuid')).status,404);assert.equal((await req('/owed/00000000-0000-4000-8000-000000000000')).status,404);assert.equal((await req('/owed/'+loan.id+'/payments/not-a-uuid','DELETE')).status,404)});
 await check('deleting a loan deletes only its own repayment log',async()=>{
  const count=loan.payments.length;assert(count>0);assert.equal((await req('/owed/'+loan.id,'DELETE')).status,200);assert.equal((await req('/owed/'+loan.id)).status,404);assert.equal((await getPool().query('select count(*)::int n from owed_payments where loan_id=$1',[loan.id])).rows[0].n,0);ids.delete(loan.id);assert.equal((await req('/owed/'+other.id)).status,200);
 });
 for(const id of ids){assert.equal((await req('/owed/'+id,'DELETE')).status,200);ids.delete(id)}
 await check('original receivables and total are preserved after fixture cleanup',async()=>{const current=(await req('/owed')).data;assert.deepEqual(current.loans,originalLoans);assert.equal(current.totalOutstandingCents,initialTotal)});
 for(const [table,rows]of Object.entries(backup.tables)){
  if(table==='sessions'||table==='schema_migrations')continue;
  await check('preserved existing '+table+' rows '+rows.length,async()=>{const actual=(await getPool().query('select * from "'+table.replaceAll('"','""')+'"')).rows;assert.deepEqual(actual.map(r=>JSON.stringify(JSON.parse(JSON.stringify(r)))).sort(),rows.map(JSON.stringify).sort())});
 }
 await check('only additive migrations 013 and 014 were added',async()=>{const current=(await getPool().query('select * from schema_migrations')).rows;for(const old of backup.tables.schema_migrations)assert(current.some(r=>r.name===old.name&&r.checksum===old.checksum));assert.equal(current.length,backup.tables.schema_migrations.length+2);assert(current.some(r=>r.name==='013_owed.sql'));assert(current.some(r=>r.name==='014_owed_retry_safety.sql'))});
 log(checks+' checks passed');
}finally{
 try{for(const id of ids){const r=await req('/owed/'+id,'DELETE');log('CLEAN fixture '+id+' '+r.status)}if(cookie){assert.equal((await req('/auth/lock','POST',{})).status,200);assert.equal((await req('/owed')).status,401);log('LOCK session revoked verified 401')}}finally{try{if(server)await new Promise(r=>server.close(r));await closePool()}finally{await lock.close();const stat=await fs.lstat(lockPath).catch(e=>{if(e.code==='ENOENT')return null;throw e});if(stat&&stat.dev===lockStat.dev&&stat.ino===lockStat.ino)await fs.unlink(lockPath)}}
}
