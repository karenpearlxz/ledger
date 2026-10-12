#!/usr/bin/env node
// Result-only job. No generator imports, no INSERT/UPDATE/DELETE of pick tables.
import { pathToFileURL } from 'node:url';
import { getPool, closePool } from '../server/src/lib/db.js';
import { backupLedger } from '../server/src/lib/backup.js';
import { isoDate } from '../server/src/lib/http.js';
import { dateAtManila, windowStart, drawInstant, matchScore, dailyAnalysis, VERSION } from '../server/src/lib/swertres.js';
import { fetchOfficialResults, exactOfficialEvaluations, OFFICIAL_SOURCE } from '../server/src/lib/swertres-official.js';

export async function runResults({now=new Date(),fetchResults=fetchOfficialResults,dryRun=false}={}) {
 const today=dateAtManila(now),pool=getPool();
 const unscored=(await pool.query('select min(p.pick_date)::text as oldest from swertres_confirmed_draw_picks p left join swertres_confirmed_draw_scores s on (s.pick_date,s.pick_draw_time,s.slot)=(p.pick_date,p.draw_time,p.slot) where s.slot is null')).rows[0]?.oldest;
 const from=unscored&&unscored<windowStart(today)?unscored:windowStart(today);
 // Bound each official query to a calendar month for long-lived missing draws.
 const fetched=[];
 for(let start=from;start<=today;){
  const d=new Date(start+'T12:00:00Z');
  const endDate=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).toISOString().slice(0,10);
  const end=endDate<today?endDate:today;
  fetched.push(...await fetchResults(start,end));
  const next=new Date(end+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);start=next.toISOString().slice(0,10);
 }
 if(fetched.some(r=>r.source!==OFFICIAL_SOURCE || drawInstant(r.draw_date,r.draw_time)>now))throw Error('Untrusted or future official result');
 if(dryRun)return {dryRun:true,source:OFFICIAL_SOURCE,from,to:today,officialRows:fetched.length,latestOfficial:fetched.at(-1)||null};
 const client=await pool.connect();let locked=false,backup=null;
 try{
  locked=(await client.query('select pg_try_advisory_lock(8600,326) as locked')).rows[0].locked;
  if(!locked)throw Error('Another Swertres job is in progress');
  backup=await backupLedger('swertres-results');
  await client.query('BEGIN');
  let inserted=0,verified=0;
  for(const r of fetched){
   const existing=(await client.query('select combo,official_verified_at from swertres_results where draw_date=$1 and draw_time=$2',[r.draw_date,r.draw_time])).rows[0];
   if(existing&&existing.combo!==r.combo)throw Error('Official/source conflict '+r.draw_date+' '+r.draw_time+' stored='+existing.combo+' official='+r.combo+'; no rows changed');
   const changed=await client.query('insert into swertres_results(draw_date,draw_time,combo,source,official_verified_at) values($1,$2,$3,$4,now()) on conflict(draw_date,draw_time) do update set source=excluded.source,official_verified_at=excluded.official_verified_at,fetched_at=now() where swertres_results.official_verified_at is null and swertres_results.combo=excluded.combo',[r.draw_date,r.draw_time,r.combo,OFFICIAL_SOURCE]);
   if(changed.rowCount){if(existing)verified++;else inserted++;}
  }
  const picks=(await client.query('select * from swertres_confirmed_draw_picks order by pick_date,draw_time,slot')).rows.map(p=>({...p,pick_date:isoDate(p.pick_date)}));
  const results=(await client.query('select * from swertres_results order by draw_date,draw_time')).rows.map(r=>({...r,draw_date:isoDate(r.draw_date)}));
  let scored=0;
  for(const {pick:p,result:r}of exactOfficialEvaluations(picks,results,now)){
   const s=matchScore(p.combo,r.combo);
   const prior=(await client.query('select * from swertres_confirmed_draw_scores where pick_date=$1 and pick_draw_time=$2 and slot=$3',[p.pick_date,p.draw_time,p.slot])).rows[0];
   if(prior&&['straight','rambolito','digit_hits','position_hits'].some(k=>prior[k]!==s[k]))throw Error('Existing score conflicts with official result; refusing to overwrite');
   const row=await client.query('insert into swertres_confirmed_draw_scores(pick_date,pick_draw_time,slot,draw_date,draw_time,straight,rambolito,digit_hits,position_hits) values($1,$2,$3,$1,$2,$4,$5,$6,$7) on conflict do nothing',[p.pick_date,p.draw_time,p.slot,s.straight,s.rambolito,s.digit_hits,s.position_hits]);scored+=row.rowCount;
  }
  const scores=(await client.query('select * from swertres_confirmed_draw_scores')).rows.map(s=>({...s,pick_date:isoDate(s.pick_date),draw_date:isoDate(s.draw_date)}));
  const analysis=dailyAnalysis(results.filter(r=>r.draw_date>=windowStart(today)),picks,scores,now);
  // Do not add duplicate analysis snapshots on a no-change rerun.
  if(inserted||verified||scored)await client.query('insert into swertres_daily_runs(run_date,analysis,algorithm_version) values($1,$2,$3)',[today,JSON.stringify(analysis),VERSION]);
  await client.query('COMMIT');
  const done=new Set(scores.map(s=>s.pick_date+'|'+s.pick_draw_time+'|'+s.slot));
  return {backup,source:OFFICIAL_SOURCE,from,to:today,officialRows:fetched.length,latestOfficial:fetched.at(-1)||null,inserted,verified,scored,picksUnchanged:true,pendingPicks:picks.filter(p=>!done.has(p.pick_date+'|'+p.draw_time+'|'+p.slot)).map(p=>({date:p.pick_date,draw:p.draw_time,combo:p.combo})),evaluations:exactOfficialEvaluations(picks,results,now).map(({pick:p,result:r})=>({date:p.pick_date,draw:p.draw_time,pick:p.combo,result:r.combo,...matchScore(p.combo,r.combo)}))};
 }catch(e){await client.query('ROLLBACK').catch(()=>{});if(backup)e.message+='; backup '+backup;throw e;}
 finally{if(locked)await client.query('select pg_advisory_unlock(8600,326)').catch(()=>{});client.release();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)runResults({dryRun:process.argv.includes('--dry-run')}).then(d=>console.log(JSON.stringify(d,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;}).finally(closePool);
