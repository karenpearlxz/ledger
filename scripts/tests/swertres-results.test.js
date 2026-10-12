import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { parseOfficialResults, fetchOfficialResults, exactOfficialEvaluations, OFFICIAL_SOURCE } from '../../server/src/lib/swertres-official.js';
import { attachPickOutcomes, swertresResponse } from '../../server/src/lib/swertres-store.js';
import { matchScore } from '../../server/src/lib/swertres.js';

const table=rows=>'<table id="cphContainer_cpContent_GridView1"><tr><th>LOTTO GAME</th><th>COMBINATIONS</th><th>DRAW DATE</th><th>JACKPOT (PHP)</th><th>WINNERS</th></tr>'+rows+'</table>';
const row=(game,combo,date)=>'<tr><td>'+game+'</td><td>'+combo+'</td><td>'+date+'</td><td>4500</td><td>1</td></tr>';
test('official parser maps games to exact times, preserving zeros and repeated digits',()=>{
 const rows=parseOfficialResults(table(row('3D Lotto 2PM',' 0-0-1 ','10/12/2026')+row('3D Lotto 5PM','1-0-0','10/12/2026')+row('2D Lotto 5PM','01-01','10/12/2026')));
 assert.deepEqual(rows.map(r=>[r.draw_time,r.combo]),[['14:00','0-0-1'],['17:00','1-0-0']]);
 assert.ok(rows.every(r=>r.source===OFFICIAL_SOURCE));
 assert.deepEqual(parseOfficialResults(table('')),[]);
});
test('official parser fails closed on missing table, invalid dates, combos, conflicting rows and pagination',()=>{
 assert.throws(()=>parseOfficialResults('<h1>Access denied</h1>'));
 assert.throws(()=>parseOfficialResults(table(row('3D Lotto 2PM','0-0-1','2/30/2026'))));
 assert.throws(()=>parseOfficialResults(table(row('3D Lotto 2PM','00-1-2','10/12/2026'))));
 assert.throws(()=>parseOfficialResults(table(row('3D Lotto 2PM','0-0-1','10/12/2026')+row('3D Lotto 2PM','0-0-2','10/12/2026'))));
 assert.throws(()=>parseOfficialResults(table('<tr><td><a>2</a></td></tr>')));
});
test('official date search submits fresh tokens, selected month names and cookies, no stale file fallback',async()=>{
 const prefix='ctl00$ctl00$cphContainer$cpContent$';
 const options={ddlStartMonth:['June'],ddlStartDate:['12'],ddlStartYear:['2026'],ddlEndMonth:['October'],ddlEndDay:['12'],ddlEndYear:['2026'],ddlSelectGame:['0']};
 const form='<input type="hidden" name="__VIEWSTATE" value="fresh"><input type="hidden" name="__EVENTVALIDATION" value="valid">'+Object.entries(options).map(([k,vs])=>'<select name="'+prefix+k+'">'+vs.map(v=>'<option value="'+v+'">'+v+'</option>').join('')+'</select>').join('');
 let calls=0;
 const fetcher=async(url,opts)=>{
  assert.equal(url,OFFICIAL_SOURCE);calls++;
  if(calls===1){const r=new Response(form,{headers:{'Content-Type':'text/html'}});r.headers.getSetCookie=()=>['session=fresh; Secure'];return r;}
  assert.equal(opts.method,'POST');assert.equal(opts.body.get('__VIEWSTATE'),'fresh');assert.equal(opts.body.get(prefix+'ddlStartMonth'),'June');assert.equal(opts.body.get(prefix+'ddlEndMonth'),'October');assert.equal(opts.headers.Cookie,'session=fresh');
  return new Response(table(row('3D Lotto 5PM','0-7-4','10/12/2026')),{headers:{'Content-Type':'text/html'}});
 };
 assert.equal((await fetchOfficialResults('2026-06-12','2026-10-12',fetcher))[0].combo,'0-7-4');assert.equal(calls,2);
 await assert.rejects(fetchOfficialResults('2026-06-12','2026-10-12',async()=>new Response('blocked',{status:403})));
});
const p={pick_date:'2026-10-12',draw_time:'17:00',slot:1,combo:'0-7-4',created_at:'2026-10-12T07:21:23.183Z'};
const official={draw_date:p.pick_date,draw_time:p.draw_time,combo:'4-7-0',official_verified_at:'2026-10-12T10:00:00Z',source:OFFICIAL_SOURCE};
const now=new Date('2026-10-12T10:00:00Z');
test('scoring uses only officially verified, already held, exact date/time draws after creation',()=>{
 const results=[official,{...official,draw_time:'14:00'},{...official,draw_time:'21:00'},{...official,draw_date:'2026-10-13'}];
 assert.equal(exactOfficialEvaluations([p],results,now).length,1);
 assert.equal(exactOfficialEvaluations([p],[{...official,official_verified_at:null}],now).length,0);
 assert.equal(exactOfficialEvaluations([p],[official],new Date('2026-10-12T08:00:00Z')).length,0);
 assert.equal(exactOfficialEvaluations([{...p,created_at:'2026-10-12T09:00:00Z'}],[official],now).length,0);
});
test('history distinguishes exact hit, any-order hit, miss, partial digits and pending official publication',()=>{
 const score=combo=>({pick_date:p.pick_date,pick_draw_time:p.draw_time,slot:p.slot,draw_date:p.pick_date,draw_time:p.draw_time,...matchScore(p.combo,combo)});
 const a=attachPickOutcomes([p],[score('4-7-0')],[official],now)[0];
 assert.equal(a.outcome.straight,'miss');assert.equal(a.outcome.anyOrder,'hit');assert.equal(a.outcome.result,'4-7-0');
 const b=attachPickOutcomes([p],[score('0-7-4')],[{...official,combo:'0-7-4'}],now)[0];
 assert.equal(b.outcome.straight,'hit');assert.equal(b.outcome.anyOrder,'hit');
 const c=attachPickOutcomes([p],[score('0-1-1')],[{...official,combo:'0-1-1'}],now)[0];
 assert.equal(c.outcome.straight,'miss');assert.equal(c.outcome.anyOrder,'miss');assert.equal(c.outcome.digitHits,1);
 for(const results of [[],[{...official,official_verified_at:null}]]){
  const o=attachPickOutcomes([p],[score('4-7-0')],results,now)[0];assert.equal(o.outcome.status,'pending');assert.equal(o.scores.length,0);assert.ok(!('straight'in o.outcome));
 }
});
test('wrong date/time scores cannot leak into a pick outcome',()=>{
 const s={pick_date:p.pick_date,pick_draw_time:p.draw_time,slot:p.slot,draw_date:p.pick_date,draw_time:'21:00',straight:true,rambolito:true,digit_hits:3,position_hits:3};
 assert.equal(attachPickOutcomes([p],[s],[official],now)[0].outcome.status,'pending');
});
test('API exposes every saved historical pick and result beyond the former 120/30 limits',async()=>{
 const picks=Array.from({length:128},(_,i)=>({...p,pick_date:'2026-10-12',slot:i+1,created_at:new Date(p.created_at),model_score:.1,odds:null}));
 const results=Array.from({length:40},()=>({...official}));
 const client={query:async(sql)=>{
  assert.ok(!/\b(?:insert|update|delete)\b/i.test(sql));assert.ok(!/limit 120/i.test(sql));
  if(sql.startsWith('select * from swertres_results'))return{rows:results};
  if(sql.startsWith('select * from swertres_confirmed_draw_picks'))return{rows:picks};
  if(sql.includes('max(fetched_at)'))return{rows:[{updated_at:now}]};
  return{rows:[]};
 }};
 const data=await swertresResponse(client,now);assert.equal(data.history.length,128);assert.equal(data.results.length,40);assert.ok(data.history.every(p=>p.outcome.status==='pending'));
});
test('result-only command has no pick generation or pick mutation; daily job scores verified results only',async()=>{
 const script=await fs.readFile(new URL('../swertres-results.js',import.meta.url),'utf8');
 assert.ok(!/generatePicks|walkForward/.test(script));assert.ok(!/(?:insert into|update|delete from) swertres_confirmed_draw_picks/i.test(script));
 assert.ok(script.indexOf("backupLedger('swertres-results')")<script.indexOf("await client.query('BEGIN')"));
 assert.ok(script.includes('on conflict do nothing'));
 const daily=await fs.readFile(new URL('../swertres-daily.js',import.meta.url),'utf8');assert.ok(daily.includes('where official_verified_at is not null'));
});
