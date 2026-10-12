import { isoDate } from './http.js';
import { coverage, dateAtManila, windowStart, combinationOdds, rankDrawPicks } from './swertres.js';

export async function swertresResponse(client, now=new Date()) {
 const today=dateAtManila(now),from=windowStart(today);
 const resultRows=(await client.query('select * from swertres_results where draw_date >= $1::date and draw_date <= $2::date order by draw_date,draw_time',[from,today])).rows.map(r=>({...r,draw_date:isoDate(r.draw_date)}));
 const picks=rankDrawPicks((await client.query('select * from swertres_confirmed_draw_picks order by pick_date desc,draw_time,slot limit 120')).rows.map(r=>({...r,pick_date:isoDate(r.pick_date),created_at:r.created_at.toISOString(),odds:r.odds||combinationOdds(r.combo),model_score:Number(r.model_score),model_score_label:'Model relative score, not win chance',true_odds:{straightPct:r.odds?.straightPercent??0.1,anyOrderPct:r.odds?.anyOrderPercent??combinationOdds(r.combo).anyOrderPercent,permutations:r.odds?.permutations??combinationOdds(r.combo).permutations},model_score_pct:Number(r.model_score)})));
 const scoreRows=(await client.query('select pick_date,pick_draw_time,slot,draw_date,draw_time,straight,rambolito,digit_hits,position_hits from swertres_confirmed_draw_scores where pick_date >= coalesce((select min(pick_date) from (select pick_date from swertres_confirmed_draw_picks order by pick_date desc,draw_time,slot limit 120) p),current_date) order by draw_date,draw_time')).rows;
 for(const p of picks)p.scores=scoreRows.filter(s=>isoDate(s.pick_date)===p.pick_date&&s.slot===p.slot&&s.pick_draw_time===p.draw_time).map(({pick_date,pick_draw_time,slot,...s})=>({...s,draw_date:isoDate(s.draw_date)}));
 const strategies=(await client.query('select strategy,weight,trials,straight_hits,any_order_hits,digit_hits,evaluation_kind,algorithm_version from swertres_strategy_stats order by strategy')).rows;
 const counts=Array(10).fill(0);for(const r of resultRows)for(const d of r.combo.split('-'))counts[Number(d)]++;
 const analysis=(await client.query('select analysis from swertres_daily_runs where run_date=$1 order by id desc limit 1',[today])).rows[0]?.analysis||null;
 const updated=(await client.query('select max(fetched_at) as updated_at from swertres_results')).rows[0]?.updated_at;
 return {today,analysis,picks:picks.filter(p=>p.pick_date===today),history:picks,results:resultRows.slice(-30).reverse().map(({fetched_at,...r})=>r),strategies,frequency:counts.map((count,digit)=>({digit,count})),coverage:coverage(resultRows,today,now),updatedAt:updated?.toISOString()||null};
}
