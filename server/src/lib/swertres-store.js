import { isoDate } from './http.js';
import { coverage, dateAtManila, windowStart, combinationOdds, rankDrawPicks, drawInstant } from './swertres.js';

export function attachPickOutcomes(picks, scoreRows, resultRows, now=new Date()) {
 const results=new Map(resultRows.map(r=>[r.draw_date+'|'+r.draw_time,r]));
 const scores=new Map(scoreRows.map(s=>[isoDate(s.pick_date)+'|'+s.pick_draw_time+'|'+s.slot,s]));
 return picks.map(p=>{
  const result=results.get(p.pick_date+'|'+p.draw_time),score=scores.get(p.pick_date+'|'+p.draw_time+'|'+p.slot);
  const eligible=result?.official_verified_at && drawInstant(p.pick_date,p.draw_time)<=now && drawInstant(p.pick_date,p.draw_time)>new Date(p.created_at);
  const valid=eligible && score && isoDate(score.draw_date)===p.pick_date && score.draw_time===p.draw_time;
  const outcome=valid?{status:'scored',straight:score.straight?'hit':'miss',anyOrder:score.rambolito?'hit':'miss',result:result.combo,source:result.source,digitHits:score.digit_hits,positionHits:score.position_hits}:{status:'pending',reason:drawInstant(p.pick_date,p.draw_time)>now?'draw not yet held':'awaiting official result'};
  return {...p,outcome,scores:valid?[{draw_date:p.pick_date,draw_time:p.draw_time,straight:score.straight,rambolito:score.rambolito,digit_hits:score.digit_hits,position_hits:score.position_hits,result:result.combo,source:result.source}]:[]};
 });
}

export async function swertresResponse(client, now=new Date()) {
 const today=dateAtManila(now),from=windowStart(today);
 // Retain and expose all saved results and predictions, not just a 120-row tail.
 const resultRows=(await client.query('select * from swertres_results order by draw_date,draw_time')).rows.map(r=>({...r,draw_date:isoDate(r.draw_date)}));
 const saved=(await client.query('select * from swertres_confirmed_draw_picks order by pick_date desc,draw_time,slot')).rows.map(r=>({...r,pick_date:isoDate(r.pick_date),created_at:r.created_at.toISOString(),odds:r.odds||combinationOdds(r.combo),model_score:Number(r.model_score),model_score_label:'Model relative score, not win chance',true_odds:{straightPct:r.odds?.straightPercent??0.1,anyOrderPct:r.odds?.anyOrderPercent??combinationOdds(r.combo).anyOrderPercent,permutations:r.odds?.permutations??combinationOdds(r.combo).permutations},model_score_pct:Number(r.model_score)}));
 const scoreRows=(await client.query('select pick_date,pick_draw_time,slot,draw_date,draw_time,straight,rambolito,digit_hits,position_hits from swertres_confirmed_draw_scores order by draw_date,draw_time')).rows;
 const picks=rankDrawPicks(attachPickOutcomes(saved,scoreRows,resultRows,now));
 const strategies=(await client.query('select strategy,weight,trials,straight_hits,any_order_hits,digit_hits,evaluation_kind,algorithm_version from swertres_strategy_stats order by strategy')).rows;
 const activeResults=resultRows.filter(r=>r.draw_date>=from&&r.draw_date<=today);
 const counts=Array(10).fill(0);for(const r of activeResults)for(const d of r.combo.split('-'))counts[Number(d)]++;
 const analysis=(await client.query('select analysis from swertres_daily_runs where run_date=$1 order by id desc limit 1',[today])).rows[0]?.analysis||null;
 const updated=(await client.query('select max(fetched_at) as updated_at from swertres_results')).rows[0]?.updated_at;
 return {today,analysis,picks:picks.filter(p=>p.pick_date===today),history:picks,results:[...resultRows].reverse().map(({fetched_at,...r})=>({...r,officialVerified:Boolean(r.official_verified_at)})),strategies,frequency:counts.map((count,digit)=>({digit,count})),coverage:coverage(activeResults,today,now),updatedAt:updated?.toISOString()||null};
}
