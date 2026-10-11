import fs from 'node:fs/promises';
import { request } from '/home/kit/node_modules/playwright/index.mjs';
import { env } from '../server/src/lib/env.js';
import { getPool,closePool } from '../server/src/lib/db.js';
const dir='/home/kit/ledger-backups',stamp=new Date().toISOString().replace(/[:.]/g,'-');
await fs.mkdir(dir,{recursive:true,mode:0o700});
const client=await getPool().connect(),snapshot={takenAt:new Date().toISOString(),schema:env.DATABASE_SCHEMA,tables:{}};
try{
 await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 const tables=(await client.query("select table_name from information_schema.tables where table_schema=$1 and table_type='BASE TABLE'",[env.DATABASE_SCHEMA])).rows;
 for(const {table_name:t} of tables){if(!/^[a-z_]+$/.test(t))throw Error('unsafe table');snapshot.tables[t]=(await client.query('select * from "'+t+'"')).rows;}
 await client.query('COMMIT');
}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
const backup=dir+'/before-content-'+stamp+'.json';
await fs.writeFile(backup,JSON.stringify(snapshot,null,2),{mode:0o600});
const disk=JSON.parse(await fs.readFile(backup,'utf8'));
if(!disk.tables.figures||!disk.tables.work_log)throw Error('invalid backup');
const source=JSON.parse(await fs.readFile('/tmp/ledger-sync-source.json','utf8'));
const api=await request.newContext({baseURL:'https://warily-vigilantly-factual-catbird.kitten.space'});
async function get(path,key){const r=await api.get(path);if(!r.ok())throw Error(await r.text());return (await r.json())[key];}
try{
 const unlock=await api.post('/api/auth/unlock',{data:{passcode:env.LEDGER_PASSCODE}});if(!unlock.ok())throw Error('unlock failed');
 const beforeFigures=await get('/api/content/figures?full=1','figures'),beforeWork=await get('/api/content/work','entries');
 const missing=source.figures.filter(f=>!beforeFigures.some(e=>e.slug===f.slug||e.name===f.name)).reverse();
 let ordinal=Math.max(...beforeFigures.map(f=>f.ordinal),0);
 const addedFigures=[];
 // Figures have no write API. Parameterized inserts only, never updates.
 for(const f of missing){
 const r=await getPool().query('insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id',[++ordinal,f.slug,f.name,f.epithet,f.lifespan,f.chipDate,f.summary,f.body,f.quote,f.quoteSource]);
 addedFigures.push({...f,ordinal,id:r.rows[0].id});
 }
 const supplemental=[
 {entryDate:'2026-10-05',title:'',body:'reviewed the mito posting plan from the oct 3 call: three accounts, two to three posts a week, and a $300 monthly two-month trial. manual posting comes first, with FAQ content and r/MentalHealth in the plan.'},
 {entryDate:'2026-10-06',title:'',body:'team meeting follow-ups centered on leading AEO generator testing, aligning marketing priorities with maddie, and helping oxen and sheena move toward system-building. railway app, clock, and website builds also failed; the failure causes were not confirmed.'},
 {entryDate:'2026-10-07',title:'',body:'rohit calls were on the calendar, including the next call on oct 8 at 1:30–2:00am philippine time. otter was not admitted to a call, so the automatic notes were incomplete.'},
 {entryDate:'2026-10-10',title:'',body:'north star check-in with maddie, oxen, and sheena shifted the focus to OGTool and Vision growth. client reddit outreach is paused; the target is ten OGTool signups a week, with keyword reports after payment. follow-ups include approving calvin’s content, verifying billing and the API, and keeping support in email and tickets rather than live chat. railway clock builds failed repeatedly. otter was not admitted and its basic plan had reached the conversation limit; fireflies provided the recap.'}
 ];
 const newest=beforeWork.reduce((d,e)=>e.entryDate>d?e.entryDate:d,'');
 const candidates=[...source.work,...supplemental].filter(e=>e.entryDate>newest).sort((a,b)=>a.entryDate.localeCompare(b.entryDate));
 const known=[...beforeWork],addedWork=[];
 for(const e of candidates){
 if(known.some(k=>k.entryDate===e.entryDate&&k.body===e.body))continue;
 const r=await api.post('/api/content/work',{data:e});if(r.status()!==201)throw Error('work insert failed '+await r.text());
 const entry=(await r.json()).entry;known.push(entry);addedWork.push(entry);
 }
 const afterFigures=await get('/api/content/figures?full=1','figures'),afterWork=await get('/api/content/work','entries');
 for(const [before,after] of [[beforeFigures,afterFigures],[beforeWork,afterWork]])for(const e of before){if(JSON.stringify(after.find(k=>k.id===e.id))!==JSON.stringify(e))throw Error('original altered');}
 for(const e of addedWork)if(!afterWork.some(k=>k.id===e.id&&k.body===e.body))throw Error('new work missing');
 for(const e of addedFigures)if(!afterFigures.some(k=>k.id===e.id&&k.body===e.body&&k.chipDate===e.chipDate))throw Error('new figure incomplete');
 for(const slug of ['anne-bronte','sara-teasdale','edna-st-vincent-millay','a-e-housman','gerard-manley-hopkins'])if(!afterFigures.some(k=>k.slug===slug&&k.body.length>1000))throw Error('daily figure absent');
 if(afterFigures.length!==beforeFigures.length+addedFigures.length||afterWork.length!==beforeWork.length+addedWork.length)throw Error('count mismatch');
 const result={backup,figuresBefore:beforeFigures.length,figuresAdded:addedFigures.length,figuresAfter:afterFigures.length,sourceFigures:source.figures.length,workBefore:beforeWork.length,workAdded:addedWork.length,workAfter:afterWork.length,addedWork,addedFigures,originalsUnchanged:true};
 await fs.writeFile(dir+'/content-result-'+stamp+'.json',JSON.stringify(result,null,2),{mode:0o600});
 console.log(JSON.stringify(result,null,2));
}finally{await api.dispose();await closePool();}
