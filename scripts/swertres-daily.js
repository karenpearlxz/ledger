#!/usr/bin/env node
import { getPool, closePool } from '../server/src/lib/db.js';
import { backupLedger } from '../server/src/lib/backup.js';
import { isoDate } from '../server/src/lib/http.js';
import { SOURCE, VERSION, parseArchive, dateAtManila, windowStart, drawInstant, walkForward, generatePicks, matchScore, eligibleAfter, eligibleFor, dailyAnalysis, parseDrawArg } from '../server/src/lib/swertres.js';
import { swertresResponse } from '../server/src/lib/swertres-store.js';

async function fetchArchive(){
 const response=await fetch(SOURCE,{signal:AbortSignal.timeout(30_000),headers:{'User-Agent':'LedgerResults/1.0','Accept':'text/html'}});
 if(!response.ok)throw Error('Archive fetch failed with HTTP '+response.status);
 if(!response.headers.get('content-type')?.includes('text/html'))throw Error('Archive is not HTML');
 const max=2_000_000;
 if(Number(response.headers.get('content-length'))>max)throw Error('Archive exceeds size limit');
 const reader=response.body.getReader(),chunks=[];let total=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>max)throw Error('Archive exceeds size limit');chunks.push(value);}}finally{await reader.cancel();}
 const html=Buffer.concat(chunks).toString('utf8');
 if(html.length<1000)throw Error('Archive unexpectedly small');
 return parseArchive(html);
}
export async function runDaily(){
 const targetDraw=parseDrawArg(process.argv.slice(2));
 // Fetch failure is fatal. Never fall back to stale files or generate from stale DB alone.
 const fetched=await fetchArchive();
 const now=new Date(),today=dateAtManila(now),from=windowStart(today);
 if(drawInstant(today,targetDraw)<=now)throw Error('Target draw already occurred; no hindsight generation');
 const rows=fetched.filter(r=>r.draw_date>=from&&r.draw_date<=today);
 if(rows.length<30)throw Error('Insufficient four-month archive');
 if(rows.some(r=>drawInstant(r.draw_date,r.draw_time)>now))throw Error('Archive contains a future completed draw');
 const yesterday=new Date(today+'T12:00:00Z');yesterday.setUTCDate(yesterday.getUTCDate()-1);
 if(rows.at(-1).draw_date<yesterday.toISOString().slice(0,10))throw Error('Archive is not current');
 const client=await getPool().connect();let locked=false,backup=null;
 try{
  // Session lock spans backup and the write transaction, excluding overlapping engines.
  const acquired=(await client.query('select pg_try_advisory_lock(8600,326) as locked')).rows[0].locked;
  if(!acquired)throw Error('Another Swertres run is in progress');locked=true;
  backup=await backupLedger('swertres-daily');
  await client.query('BEGIN');
  for(const r of rows){
   const existing=(await client.query('select combo from swertres_results where draw_date=$1 and draw_time=$2',[r.draw_date,r.draw_time])).rows[0];
   if(existing&&existing.combo!==r.combo)throw Error('Conflicting source result '+r.draw_date+' '+r.draw_time+' stored='+existing.combo+' fetched='+r.combo);
   // A same-combination refresh can update fetch provenance, never the combination.
   await client.query('insert into swertres_results(draw_date,draw_time,combo,source) values($1,$2,$3,$4) on conflict(draw_date,draw_time) do update set fetched_at=now(),source=excluded.source where swertres_results.combo=excluded.combo',[r.draw_date,r.draw_time,r.combo,r.source]);
  }
  const history=(await client.query('select draw_date,draw_time,combo from swertres_results where draw_date >= $1 and draw_date <= $2 order by draw_date,draw_time',[from,today])).rows.map(r=>({...r,draw_date:isoDate(r.draw_date)})).filter(r=>drawInstant(r.draw_date,r.draw_time)<=now);
  const learned=walkForward(history,today);
  for(const log of learned.logs){
   await client.query('insert into swertres_weight_log(evaluation_date,algorithm_version,history_through,training_draws,weights_before,weights_after,rewards) values($1,$2,$3,$4,$5,$6,$7) on conflict(evaluation_date,algorithm_version) do update set history_through=excluded.history_through,training_draws=excluded.training_draws,weights_before=excluded.weights_before,weights_after=excluded.weights_after,rewards=excluded.rewards where (swertres_weight_log.weights_after,swertres_weight_log.training_draws,swertres_weight_log.rewards) is distinct from (excluded.weights_after,excluded.training_draws,excluded.rewards)',[log.evaluation_date,VERSION,log.history_through,log.training_draws,JSON.stringify(log.before),JSON.stringify(log.after),JSON.stringify(log.rewards)]);
  }
  for(const s of learned.stats)await client.query('insert into swertres_strategy_stats(strategy,weight,trials,straight_hits,any_order_hits,digit_hits,history_from,history_to,algorithm_version) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(strategy) do update set weight=excluded.weight,trials=excluded.trials,straight_hits=excluded.straight_hits,any_order_hits=excluded.any_order_hits,digit_hits=excluded.digit_hits,history_from=excluded.history_from,history_to=excluded.history_to,algorithm_version=excluded.algorithm_version,updated_at=now() where (swertres_strategy_stats.weight,swertres_strategy_stats.trials,swertres_strategy_stats.history_from,swertres_strategy_stats.history_to) is distinct from (excluded.weight,excluded.trials,excluded.history_from,excluded.history_to)',[s.strategy,s.weight,s.trials,s.straight_hits,s.any_order_hits,s.digit_hits,from,today,VERSION]);
  const stored=(await client.query('select * from swertres_confirmed_draw_picks order by pick_date,draw_time,slot')).rows.map(p=>({...p,pick_date:isoDate(p.pick_date)}));
  // Actual picks are never replaced. Backtest predictions live only in stats/logs.
  const todays=stored.filter(p=>p.pick_date===today&&p.draw_time===targetDraw);
  if(todays.length!==0&&todays.length!==4)throw Error('Incomplete existing picks, refusing to alter them');
  let generated=false;
  if(!todays.length){
   const createdAt=new Date();
   if(dateAtManila(createdAt)!==today)throw Error('Day changed during run, retry');
   if(drawInstant(today,targetDraw)<=createdAt)throw Error('Target draw occurred during run; no hindsight generation');
   const eligible=targetDraw;
   for(const p of generatePicks(history,learned.weights,today,targetDraw)){
    p.strategy_breakdown.evaluation_kind='historical walk-forward backtest';
    await client.query('insert into swertres_confirmed_draw_picks(pick_date,draw_time,slot,combo,strategy_breakdown,eligible_after,created_at,odds,model_score) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[today,targetDraw,p.slot,p.combo,JSON.stringify(p.strategy_breakdown),eligible,createdAt.toISOString(),JSON.stringify(p.odds),p.model_score]);
   }generated=true;
  }
  // Include all previous stored dates so archive backfills score genuine missed draws.
  const allResults=(await client.query('select draw_date,draw_time,combo from swertres_results order by draw_date,draw_time')).rows.map(r=>({...r,draw_date:isoDate(r.draw_date)}));
  for(const p of stored)for(const r of allResults){
   if(!eligibleFor(p,r)||drawInstant(r.draw_date,r.draw_time)>now)continue;
   const score=matchScore(p.combo,r.combo);
   await client.query('insert into swertres_confirmed_draw_scores(pick_date,pick_draw_time,slot,draw_date,draw_time,straight,rambolito,digit_hits,position_hits) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict do nothing',[p.pick_date,p.draw_time,p.slot,r.draw_date,r.draw_time,score.straight,score.rambolito,score.digit_hits,score.position_hits]);
  }
  const allPicks=(await client.query('select * from swertres_confirmed_draw_picks order by pick_date,draw_time,slot')).rows.map(p=>({...p,pick_date:isoDate(p.pick_date)}));
  const allScores=(await client.query('select * from swertres_confirmed_draw_scores')).rows.map(s=>({...s,pick_date:isoDate(s.pick_date),draw_date:isoDate(s.draw_date)}));
  const analysis=dailyAnalysis(history,allPicks,allScores,new Date());
  await client.query('insert into swertres_daily_runs(run_date,analysis,algorithm_version) values($1,$2,$3)',[today,JSON.stringify(analysis),VERSION]);
  const response=await swertresResponse(client,now);
  await client.query('COMMIT');
  return {backup,generated,targetDraw,source:SOURCE,...response};
 }catch(e){
  await client.query('ROLLBACK').catch(()=>{});
  if(backup)e.message+='; backup '+backup;
  throw e;
 }finally{
  if(locked)await client.query('select pg_advisory_unlock(8600,326)').catch(()=>{});
  client.release();
 }
}
runDaily().then(data=>console.log(JSON.stringify(data,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;}).finally(closePool);
