import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArchive, parseLabelDate, matchScore, updateWeights, walkForward, generatePicks, eligibleFor, eligibleAfter, windowStart, coverage, STRATEGIES } from '../../server/src/lib/swertres.js';

const html=(rows)=>'<table><tr><th>Draw Date</th><th>2:00 PM</th><th>5:00 PM</th><th>9:00 PM</th></tr>'+rows+'</table>';
test('parser uses label, not erroneous link; preserves zeros and repeat digits',()=>{
 const rows=parseArchive(html('<tr><td><a href="/wrong-date">Jun. 12, 2026</a></td><td>0-0-1</td><td>0-7-0</td><td>–</td></tr>'));
 assert.equal(rows.length,2);assert.equal(rows[0].draw_date,'2026-06-12');assert.equal(rows[0].combo,'0-0-1');assert.equal(rows[1].combo,'0-7-0');
 assert.equal(parseLabelDate('July 9, 2026'),'2026-07-09');
 assert.throws(()=>parseLabelDate('Jun 31, 2026'));
});
test('parser rejects invalid combinations, missing headers and duplicate conflicting rows',()=>{
 assert.throws(()=>parseArchive(html('<tr><td>Jun 12, 2026</td><td>00-1-2</td><td>–</td><td>–</td></tr>')));
 assert.throws(()=>parseArchive('<table></table>'));
 const row=c=>'<tr><td>Jun 12, 2026</td><td>'+c+'</td><td>–</td><td>–</td></tr>';
 assert.throws(()=>parseArchive(html(row('0-0-1')+row('0-0-2'))));
});
test('rambolito requires exact repeated-digit multiset',()=>{
 assert.deepEqual(matchScore('0-0-1','0-1-0'),{straight:false,rambolito:true,digit_hits:3,position_hits:1});
 assert.deepEqual(matchScore('0-0-1','0-1-1'),{straight:false,rambolito:false,digit_hits:2,position_hits:2});
 assert.equal(matchScore('0-0-0','0-0-0').straight,true);
});
test('weights remain finite bounded normalized and reward-dependent',()=>{
 let w=Object.fromEntries(STRATEGIES.map(s=>[s,.25]));
 for(let i=0;i<1000;i++)w=updateWeights(w,Object.fromEntries(STRATEGIES.map((s,j)=>[s,j===0?1:0])));
 assert.ok(Math.abs(Object.values(w).reduce((a,b)=>a+b,0)-1)<1e-12);
 assert.ok(Object.values(w).every(v=>v>0&&v<1));assert.ok(w.hot_overall>w.hot_position);
});
function history(){
 const out=[];
 for(let i=0;i<16;i++){const d=new Date('2026-06-12T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);for(const [j,time] of ['14:00','17:00','21:00'].entries())out.push({draw_date:d.toISOString().slice(0,10),draw_time:time,combo:[i%10,(i+j)%10,j].join('-')});}
 return out;
}
test('walk-forward uses preceding dates only; future mutations cannot alter prior weights',()=>{
 const rows=history(),cutoff='2026-06-25';
 const a=walkForward(rows,cutoff);
 const b=walkForward(rows.map(r=>r.draw_date>cutoff?{...r,combo:'9-9-9'}:r),cutoff);
 assert.deepEqual(a,b);
 for(const log of a.logs)assert.ok(log.history_through<log.evaluation_date);
 const changed=walkForward(rows.map(r=>r.draw_date==='2026-06-25'?{...r,combo:'9-9-9'}:r),cutoff);
 assert.deepEqual(a.logs.at(-1).before,changed.logs.at(-1).before);
 assert.equal(a.logs[0].training_draws,30);
});
test('four unique seeded ensemble picks are deterministic and breakdown is not a probability',()=>{
 const rows=history(),w=walkForward(rows,'2026-06-27').weights;
 const a=generatePicks(rows,w,'2026-06-28'),b=generatePicks(rows,w,'2026-06-28');
 assert.deepEqual(a,b);assert.equal(new Set(a.map(p=>p.combo)).size,4);
 assert.ok(a.every(p=>/^\d-\d-\d$/.test(p.combo)));
});
test('afternoon actual picks never scored on completed draw or another date',()=>{
 const p={pick_date:'2026-10-12',eligible_after:'17:00',created_at:'2026-10-12T07:30:00Z'};
 assert.equal(eligibleAfter(p.pick_date,new Date(p.created_at)),'17:00');
 assert.equal(eligibleFor(p,{draw_date:p.pick_date,draw_time:'14:00'}),false);
 assert.equal(eligibleFor(p,{draw_date:p.pick_date,draw_time:'17:00'}),true);
 assert.equal(eligibleFor(p,{draw_date:'2026-10-13',draw_time:'17:00'}),false);
 assert.equal(eligibleFor({...p,created_at:'2026-10-12T09:00:00Z'},{draw_date:p.pick_date,draw_time:'17:00'}),false);
 assert.equal(eligibleAfter(p.pick_date,new Date('2026-10-12T14:00:00Z')),'next-day');
});
test('coverage is inclusive four calendar months and reports only elapsed missing draws',()=>{
 assert.equal(windowStart('2026-10-12'),'2026-06-12');
 assert.equal(windowStart('2026-06-30'),'2026-02-28');
 const c=coverage([{draw_date:'2026-10-12',draw_time:'14:00'}],'2026-10-12',new Date('2026-10-12T07:00:00Z'));
 assert.ok(!c.missing.some(r=>r.draw_date==='2026-10-12'));assert.equal(c.from,'2026-06-12');
});

test('hot strategies use at most90 recent winning draws, old mutations irrelevant to hot scores',async()=>{
 const {recentWindow,strategyScores,dailyAnalysis}=await import('../../server/src/lib/swertres.js');
 const rows=history();
 const old={draw_date:'2026-05-01',draw_time:'14:00',combo:'0-0-0'};
 const a=strategyScores([old,...rows]),b=strategyScores([{...old,combo:'9-9-9'},...rows]);
 assert.deepEqual(a.hot_overall,b.hot_overall);assert.deepEqual(a.hot_position,b.hot_position);assert.deepEqual(a.recent_pairs,b.recent_pairs);
 assert.equal(recentWindow([old,...rows]).length,48);
 const analysis=dailyAnalysis(rows,[],[],new Date('2026-06-28T02:00:00Z'));
 assert.equal(analysis.date,'2026-06-28');assert.equal(analysis.yesterday.date,'2026-06-27');
 assert.equal(analysis.yesterday.status,'no picks recorded');assert.equal(analysis.yesterday.straightHits,null);
 assert.equal(analysis.hotDigits.reduce((n,d)=>n+d.count,0),144);
 assert.ok(analysis.summary.some(s=>s.includes('no picks recorded')));
 assert.equal(analysis.hotPositions.length,3);
});
test('per-draw eligibility, explicit draw command, and exact theoretical odds',async()=>{
 const {parseDrawArg,combinationOdds}=await import('../../server/src/lib/swertres.js');
 assert.equal(parseDrawArg(['--draw','5pm']),'17:00');assert.throws(()=>parseDrawArg([]));
 assert.deepEqual(combinationOdds('1-2-3'),{straightPercent:.1,anyOrderPercent:.6,permutations:6});
 assert.deepEqual(combinationOdds('1-1-3'),{straightPercent:.1,anyOrderPercent:.3,permutations:3});
 assert.deepEqual(combinationOdds('0-0-0'),{straightPercent:.1,anyOrderPercent:.1,permutations:1});
 const p={pick_date:'2026-10-12',draw_time:'17:00',eligible_after:'17:00',created_at:'2026-10-12T07:30:00Z'};
 assert.equal(eligibleFor(p,{draw_date:p.pick_date,draw_time:'17:00'}),true);
 assert.equal(eligibleFor(p,{draw_date:p.pick_date,draw_time:'21:00'}),false);
});

test('relative model scores normalize all1000 to100percent before selection including zeros',async()=>{
 const {normalizeModelScores}=await import('../../server/src/lib/swertres.js');
 const raw=Array.from({length:1000},(_,i)=>i%7===0?0:i+1),scores=normalizeModelScores(raw);
 assert.ok(Math.abs(scores.reduce((a,b)=>a+b,0)-100)<1e-10);assert.equal(scores[0],0);
 assert.ok(Math.max(...scores)<1);assert.equal(normalizeModelScores(Array(1000).fill(0))[0],.1);
 assert.throws(()=>normalizeModelScores([1,2,3,4]));
});

test('top_pick follows saved numeric score not slot, unique per date draw group',async()=>{
 const {rankDrawPicks}=await import('../../server/src/lib/swertres.js');
 const picks=[
 {pick_date:'2026-10-12',draw_time:'17:00',slot:1,model_score:.1},
 {pick_date:'2026-10-12',draw_time:'17:00',slot:4,model_score:.2},
 {pick_date:'2026-10-12',draw_time:'21:00',slot:2,model_score:.3},
 {pick_date:'2026-10-12',draw_time:'21:00',slot:1,model_score:.3}];
 const out=rankDrawPicks(picks);assert.equal(out[0].slot,4);assert.equal(out[0].top_pick,true);
 assert.equal(out.filter(p=>p.top_pick).length,2);assert.equal(out[2].slot,1);
 assert.ok(picks.every(p=>!('top_pick'in p)));
});
