import { load } from 'cheerio';
import { createHash } from 'node:crypto';

export const SOURCE = 'https://www.lottopcso.com/swertres-results-today-history-and-summary/';
export const TIMES = ['14:00', '17:00', '21:00'];
export const STRATEGIES = ['hot_overall', 'hot_position', 'overdue_cold', 'recent_pairs'];
export const VERSION = 'walk-forward-recent-v2';
export const digits = (combo) => combo.split('-').map(Number);
export const drawInstant = (date, time) => new Date(date + 'T' + time + ':00+08:00');
export const dateAtManila = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

export function windowStart(date) {
  const [y,m,d] = date.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 5, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(d,last));
  return first.toISOString().slice(0,10);
}

export function parseLabelDate(text) {
  const m = /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(\d{4})$/i.exec(text.trim());
  if (!m) throw Error('Unrecognized draw date label: ' + text);
  const month = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[1].slice(0,3).toLowerCase());
  const d = new Date(Date.UTC(Number(m[3]),month,Number(m[2])));
  if(d.getUTCMonth() !== month || d.getUTCDate() !== Number(m[2])) throw Error('Invalid draw date');
  return d.toISOString().slice(0,10);
}

export function parseArchive(html) {
  if (Buffer.byteLength(html) > 2_000_000) throw Error('Archive exceeds size limit');
  const $ = load(html);
  const tables = $('table').filter((_,t) => {
    const heads = $(t).find('tr').first().find('th,td').map((_,e)=>$(e).text().trim()).get();
    return heads.join('|') === 'Draw Date|2:00 PM|5:00 PM|9:00 PM';
  });
  if (tables.length !== 1) throw Error('Expected exactly one draw-date archive table');
  const found = new Map();
  tables.find('tr').slice(1).each((_,tr) => {
    const cells = $(tr).find('td');
    if(cells.length !== 4) throw Error('Malformed archive row');
    // Labels are authoritative. Some archived anchor hrefs point to another day.
    const draw_date = parseLabelDate(cells.eq(0).text().trim());
    for(let i=0;i<3;i++){
      const combo = cells.eq(i+1).text().trim().replace(/\s+/g,'');
      if(/^[–—-]+$/.test(combo) || combo === '') continue;
      if(!/^\d-\d-\d$/.test(combo)) throw Error('Invalid combination on ' + draw_date);
      const row = {draw_date, draw_time:TIMES[i], combo, source:SOURCE};
      const key = draw_date + '|' + TIMES[i];
      if(found.has(key) && found.get(key).combo !== combo) throw Error('Conflicting archive row ' + key);
      found.set(key,row);
    }
  });
  if(!found.size) throw Error('Empty archive');
  return [...found.values()].sort((a,b)=>(a.draw_date+a.draw_time).localeCompare(b.draw_date+b.draw_time));
}

export function coverage(rows, today, now=new Date()) {
  const from = windowStart(today);
  const inside = rows.filter(r=>r.draw_date>=from && r.draw_date<=today);
  const seen = new Set(inside.map(r=>r.draw_date+'|'+r.draw_time));
  const missing=[];
  for(let d=new Date(from+'T12:00:00Z');d.toISOString().slice(0,10)<=today;d.setUTCDate(d.getUTCDate()+1)){
    const day=d.toISOString().slice(0,10);
    for(const t of TIMES) if(drawInstant(day,t)<=now && !seen.has(day+'|'+t)) missing.push({draw_date:day,draw_time:t});
  }
  return {from,to:today,draws:inside.length,missing};
}

export function matchScore(pick, result) {
  const a=digits(pick),b=digits(result);
  const ac=Array(10).fill(0),bc=Array(10).fill(0);
  for(const d of a)ac[d]++;for(const d of b)bc[d]++;
  const digit_hits=ac.reduce((sum,c,d)=>sum+Math.min(c,bc[d]),0);
  return {straight:pick===result,rambolito:digit_hits===3,digit_hits,position_hits:a.reduce((n,d,i)=>n+Number(d===b[i]),0)};
}

export function eligibleAfter(date,now) {
  return TIMES.find(t=>drawInstant(date,t)>now) || 'next-day';
}
export function eligibleFor(pick,draw) {
  return (!pick.draw_time || pick.draw_time===draw.draw_time) && drawInstant(draw.draw_date,draw.draw_time) > new Date(pick.created_at) &&
    draw.draw_date===pick.pick_date && pick.eligible_after!=='next-day' && draw.draw_time>=pick.eligible_after;
}

const candidates=Array.from({length:1000},(_,i)=>String(i).padStart(3,'0').split('').join('-'));
const tie=(seed,combo)=>createHash('sha256').update(seed+'|'+combo).digest().readUInt32BE(0);
const normalized=(arr)=>{
  const lo=Math.min(...arr),hi=Math.max(...arr);
  return arr.map(v=>hi===lo ? 0.5 : (v-lo)/(hi-lo));
};
export function recentWindow(history) {
  if(!history.length)return [];
  const cutoff=new Date(history.at(-1).draw_date+'T12:00:00Z');
  cutoff.setUTCDate(cutoff.getUTCDate()-29);
  const from=cutoff.toISOString().slice(0,10);
  return history.filter(r=>r.draw_date>=from).slice(-90);
}

export function dailyAnalysis(rows,picks,scores,now=new Date()) {
  const today=dateAtManila(now),recent=recentWindow(rows);
  const count=Array(10).fill(0),positions=Array.from({length:3},()=>Array(10).fill(0));
  let doubles=0,triples=0;
  for(const r of recent){
    const ds=digits(r.combo);ds.forEach((d,p)=>{count[d]++;positions[p][d]++;});
    const unique=new Set(ds).size;if(unique===1)triples++;else if(unique===2)doubles++;
  }
  const pairs=new Map();
  for(const r of rows.slice(-30)){
    const ds=digits(r.combo);
    for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){
      const pair=[ds[a],ds[b]].sort().join('-');pairs.set(pair,(pairs.get(pair)||0)+1);
    }
  }
  const ranked=counts=>counts.map((count,digit)=>({digit,count})).sort((a,b)=>b.count-a.count||a.digit-b.digit);
  const hotDigits=ranked(count),hotPositions=positions.map(ranked);
  const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-1);
  const yesterdayDate=date.toISOString().slice(0,10),yp=picks.filter(p=>p.pick_date===yesterdayDate),ys=scores.filter(s=>s.pick_date===yesterdayDate);
  const yesterday={date:yesterdayDate,picks:yp.length,scoredDraws:new Set(ys.map(s=>s.draw_date+'|'+s.draw_time)).size,straightHits:yp.length?ys.filter(s=>s.straight).length:null,anyOrderHits:yp.length?ys.filter(s=>s.rambolito).length:null,digitHits:yp.length?ys.reduce((n,s)=>n+s.digit_hits,0):null,status:!yp.length?'no picks recorded':!ys.length?'results not scored yet':'scored'};
  const recentPairs=[...pairs].map(([pair,count])=>({pair,count})).sort((a,b)=>b.count-a.count||a.pair.localeCompare(b.pair)).slice(0,10);
  const summary=[
    'Recent winning results: '+recent.length+' draws, '+(recent[0]?.draw_date||today)+' through '+(recent.at(-1)?.draw_date||today)+'.',
    'Most frequent recent digits: '+hotDigits.slice(0,3).map(d=>d.digit+' ('+d.count+')').join(', ')+'.',
    'Recent patterns: '+doubles+' double-digit draws and '+triples+' triple-digit draws.',
    'Pairs use the last '+Math.min(30,rows.length)+' draws; strongest pair: '+(recentPairs[0]?.pair||'none')+'.',
    !yp.length?'Yesterday: no picks recorded.':!ys.length?'Yesterday: picks recorded, results not scored yet.':'Yesterday: '+yp.length+' picks across '+yesterday.scoredDraws+' scored draws; '+yesterday.straightHits+' straight and '+yesterday.anyOrderHits+' any-order matches.',
    'Frequency and backtests describe past results; they do not establish better lottery odds.'
  ];
  return {date:today,windowLabel:'Last 30 calendar days, capped at 90 completed draws',hotDigits,hotPositions,recentPairs,patterns:{doubles,triples,draws:recent.length},yesterday,summary,generatedAt:now.toISOString()};
}

export function strategyScores(history) {
  if(history.length<30) throw Error('Need 30 completed draws before generating picks');
  const recent=recentWindow(history);
  const count=Array(10).fill(1),pos=Array.from({length:3},()=>Array(10).fill(1));
  const last=Array(10).fill(-1),pairs=new Map();
  recent.forEach(r=>digits(r.combo).forEach((d,p)=>{count[d]++;pos[p][d]++;}));
  history.forEach((r,i)=>digits(r.combo).forEach(d=>{last[d]=i;}));
  for(const r of history.slice(-30)){
    const ds=digits(r.combo);
    for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){
      const k=[ds[a],ds[b]].sort().join('-');pairs.set(k,(pairs.get(k)||0)+1);
    }
  }
  const cold=count.map((n,d)=>0.65*(history.length-last[d])/history.length+0.35/Math.sqrt(n));
  const raw=Object.fromEntries(STRATEGIES.map(s=>[s,[]]));
  for(const combo of candidates){
    const ds=digits(combo);
    raw.hot_overall.push(ds.reduce((s,d)=>s+Math.log(count[d]),0));
    raw.hot_position.push(ds.reduce((s,d,p)=>s+Math.log(pos[p][d]),0));
    raw.overdue_cold.push(ds.reduce((s,d)=>s+cold[d],0));
    let total=0;for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)total+=Math.log(1+(pairs.get([ds[a],ds[b]].sort().join('-'))||0));
    raw.recent_pairs.push(total);
  }
  return Object.fromEntries(STRATEGIES.map(s=>[s,normalized(raw[s])]));
}

export function selectFour(scores, seed) {
  const ranked=candidates.map((combo,i)=>({combo,score:scores[i],tie:tie(seed,combo)})).sort((a,b)=>b.score-a.score||a.tie-b.tie);
  const selected=[];
  // Penalize similar multisets, then similar positions. Stable seeded tie-breaks.
  while(selected.length<4){
    let best=null,bestValue=-Infinity;
    for(const r of ranked){
      if(selected.some(p=>p.combo===r.combo))continue;
      const penalty=selected.reduce((v,p)=>Math.max(v,matchScore(p.combo,r.combo).digit_hits/3*0.12+matchScore(p.combo,r.combo).position_hits/3*0.04),0);
      const value=r.score-penalty;
      if(value>bestValue){best=r;bestValue=value;}
    }
    selected.push(best);
  }
  return selected.map(r=>r.combo);
}

export function updateWeights(weights,rewards) {
  const next=Object.fromEntries(STRATEGIES.map(s=>[s,Math.max(0.05,Math.min(0.8,weights[s]*Math.exp(0.3*rewards[s])))]));
  const sum=Object.values(next).reduce((a,b)=>a+b,0);
  // Uniform mixing gives every strategy a bounded, nonzero normalized share.
  return Object.fromEntries(STRATEGIES.map(s=>[s,0.9*next[s]/sum+0.1/4]));
}

export function walkForward(rows, endDate) {
  const ordered=rows.filter(r=>r.draw_date<=endDate).sort((a,b)=>(a.draw_date+a.draw_time).localeCompare(b.draw_date+b.draw_time));
  let weights=Object.fromEntries(STRATEGIES.map(s=>[s,0.25]));
  const stats=Object.fromEntries(STRATEGIES.map(s=>[s,{strategy:s,trials:0,straight_hits:0,any_order_hits:0,digit_hits:0}]));
  const logs=[],history=[];
  for(const date of [...new Set(ordered.map(r=>r.draw_date))]){
    const draws=ordered.filter(r=>r.draw_date===date);
    // Predict once before this calendar date, not after its first draw.
    if(history.length>=30){
      const matrix=strategyScores(history),rewards={};
      for(const s of STRATEGIES){
        const predictions=selectFour(matrix[s],date+'|'+s);
        let reward=0;
        for(const d of draws)for(const p of predictions){
          const score=matchScore(p,d.combo);
          stats[s].trials++;stats[s].straight_hits+=Number(score.straight);
          stats[s].any_order_hits+=Number(score.rambolito);stats[s].digit_hits+=score.digit_hits;
          reward+=Number(score.straight)*1+Number(score.rambolito)*0.25+score.digit_hits/3*0.03;
        }
        rewards[s]=reward/(draws.length*4);
      }
      const before=weights;weights=updateWeights(weights,rewards);
      logs.push({evaluation_date:date,history_through:history.at(-1).draw_date,training_draws:history.length,before,after:weights,rewards});
    }
    history.push(...draws);
  }
  return {weights,stats:Object.values(stats).map(s=>({...s,weight:weights[s.strategy]})),logs};
}

export function generatePicks(history,weights,date,drawTime='') {
  const matrix=strategyScores(history);
  const ensemble=candidates.map((_,i)=>STRATEGIES.reduce((n,s)=>n+weights[s]*matrix[s][i],0));
  const modelScores=normalizeModelScores(ensemble);
  return selectFour(ensemble,date+'|'+drawTime+'|ensemble').map((combo,i)=>{
    const index=candidates.indexOf(combo);
    return {slot:i+1,combo,odds:combinationOdds(combo),model_score:modelScores[index],strategy_breakdown:{version:VERSION,training_draws:history.length,recent_draws:recentWindow(history).length,hot_window:'last30days capped90draws',pair_window:'last30draws',training_through:history.at(-1).draw_date+' '+history.at(-1).draw_time,weights,components:Object.fromEntries(STRATEGIES.map(s=>[s,matrix[s][index]])),ensemble_score:ensemble[index],model_score_pct:modelScores[index],true_odds:combinationOdds(combo),selection:'weighted ensemble with diversity, not probabilities'}};
  });
}

export function combinationOdds(combo) {
 const ds=digits(combo),counts=Array(10).fill(0);ds.forEach(d=>counts[d]++);
 const factorial=n=>n<2?1:n*factorial(n-1);
 const permutations=6/counts.reduce((n,c)=>n*factorial(c),1);
 return {straightPercent:0.1,anyOrderPercent:permutations/10,permutations};
}
export function parseDrawArg(args) {
 const index=args.indexOf('--draw');
 const value=index>=0?args[index+1]:null;
 const time={'2pm':'14:00','5pm':'17:00','9pm':'21:00'}[value];
 if(!time)throw Error('Required --draw 2pm|5pm|9pm');
 return time;
}

export function normalizeModelScores(scores) {
 if(scores.length!==1000 || scores.some(s=>!Number.isFinite(s)||s<0))throw Error('Expected 1000 finite nonnegative model scores');
 const total=scores.reduce((a,b)=>a+b,0);
 return scores.map(s=>total?s/total*100:0.1);
}

export function rankDrawPicks(picks) {
 const ranked=picks.map(p=>({...p,top_pick:false})).sort((a,b)=>
 b.pick_date.localeCompare(a.pick_date)||a.draw_time.localeCompare(b.draw_time)||
 Number(b.model_score)-Number(a.model_score)||a.slot-b.slot);
 const seen=new Set();
 for(const p of ranked){const group=p.pick_date+'|'+p.draw_time;if(!seen.has(group)){p.top_pick=true;seen.add(group);}}
 return ranked;
}
