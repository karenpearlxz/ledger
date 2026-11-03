import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { officialHistory, loadOfficialHistory } from '../../server/src/lib/swertres-history.js';
import { OFFICIAL_SOURCE } from '../../server/src/lib/swertres-official.js';
import { generatePicks, walkForward } from '../../server/src/lib/swertres.js';

const now=new Date('2026-11-03T07:00:00Z'),from='2026-07-03',today='2026-11-03';
const verified=Array.from({length:33},(_,i)=>({
 draw_date:'2026-11-'+String(Math.floor(i/3)+1).padStart(2,'0'),draw_time:['14:00','17:00','21:00'][i%3],combo:'0-1-2',
 source:OFFICIAL_SOURCE,official_verified_at:'2026-11-03T06:30:00Z'
}));
// Ten days of elapsed official draws, then a same-day completed official draw.
verified.forEach((r,i)=>{r.draw_date=new Date(Date.UTC(2026,9,23+Math.floor(i/3))).toISOString().slice(0,10);});
verified.push({...verified[0],draw_date:today,draw_time:'14:00'});

test('model input excludes unverified, wrong-source, future and out-of-window results',async()=>{
 const secondary={...verified.at(-1),combo:'9-9-9',source:'https://www.lottopcso.com/swertres-results-today-history-and-summary/',official_verified_at:null};
 const mixed=[...verified,secondary,{...secondary,source:OFFICIAL_SOURCE},{...secondary,official_verified_at:now.toISOString()},{...verified[0],draw_date:'2026-07-02'},{...verified.at(-1),draw_time:'17:00'}];
 const client={query:async(sql,args)=>{
  assert.match(sql,/official_verified_at is not null and source=\$3/);
  assert.deepEqual(args,[from,today,OFFICIAL_SOURCE]);
  // Deliberately return even rows SQL should exclude to exercise the second guard.
  return {rows:mixed};
 }};
 const history=await loadOfficialHistory(client,from,today,now);
 assert.deepEqual(history,verified);
 const clean=walkForward(verified,today),actual=walkForward(history,today);
 assert.deepEqual(actual,clean);
 assert.deepEqual(generatePicks(history,actual.weights,today,'17:00'),generatePicks(verified,clean.weights,today,'17:00'));
 assert.deepEqual(officialHistory([secondary],from,today,now),[]);
});

test('secondary freshness cannot make insufficient or stale official history eligible',async()=>{
 await assert.rejects(loadOfficialHistory({query:async()=>({rows:verified.slice(0,29)})},from,today,now),/Insufficient officially verified/);
 const stale=verified.filter(r=>r.draw_date<'2026-11-02');
 assert.ok(stale.length>=30);
 const unverified={...verified.at(-1),official_verified_at:null};
 await assert.rejects(loadOfficialHistory({query:async()=>({rows:[...stale,unverified]})},from,today,now),/not current/);
});

test('generation, learning and analysis consume official history, with archive imports still unverified',async()=>{
 const daily=await fs.readFile(new URL('../swertres-daily.js',import.meta.url),'utf8');
 assert.match(daily,/const history=await loadOfficialHistory\(client,from,today,now\)/);
 assert.match(daily,/walkForward\(history,today\)/);
 assert.match(daily,/generatePicks\(history,learned.weights,today,targetDraw\)/);
 assert.match(daily,/dailyAnalysis\(history,allPicks,allScores/);
 assert.match(daily,/insert into swertres_results\(draw_date,draw_time,combo,source\)/);
 const results=await fs.readFile(new URL('../swertres-results.js',import.meta.url),'utf8');
 assert.match(results,/dailyAnalysis\(officialHistory\(results,windowStart\(today\),today,now\)/);
});
